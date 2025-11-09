import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/send-email";
import { assignRoleToUser } from "@/lib/discord/roles";
import { notifyPlanUpdated } from "@/lib/discord/dm-notifications";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { SiteConfig } from "@/site-config";
import BilingualMarkdownEmail from "@email/bilingual-markdown.email";
import SubscriptionActivationEmail from "@email/subscription-activation";
import { awardUpgradeBonus } from "@/lib/referral/invitation-tracking-service";
import { revalidatePath } from "next/cache";

/**
 * Subscription Manager - Big Bang (Issue #77 Phase 3)
 *
 * Module centralisé pour gérer le cycle de vie des abonnements MyCryptoPilot
 *
 * Responsabilités:
 * - Activer/étendre un abonnement (update User + UserSubscription)
 * - Assigner automatiquement le rôle Discord correspondant
 * - Envoyer les emails de notification (activation, renouvellement, expiration)
 *
 * Architecture:
 * - Appelé depuis payment-watcher.ts après confirmation de paiement crypto
 * - Appelé depuis admin actions pour gestion manuelle
 * - Utilise Discord roles.ts pour l'assignation automatique
 * - Utilise Resend pour les notifications email
 * - User-centric: Direct User → UserSubscription relationship
 */

type SubscriptionActivationParams = {
  userId: string;
  plan: MyCryptoPilotPlanName;
  daysGranted: number;
  source?: "crypto_payment" | "admin" | "stripe_legacy";
};

type SubscriptionResult = {
  success: boolean;
  periodEnd?: Date;
  error?: string;
};

/**
 * Activer ou étendre l'abonnement d'un utilisateur
 *
 * Séquence complète (user-centric):
 * 1. Update User.planName et User.planExpiresAt
 * 2. Upsert UserSubscription directement
 * 3. Assigner rôle Discord (si discordId présent)
 * 4. Envoyer email de confirmation
 *
 * @param params - Paramètres d'activation
 * @returns SubscriptionResult avec succès/erreur
 */
export async function activateSubscription(
  params: SubscriptionActivationParams,
): Promise<SubscriptionResult> {
  const { userId, plan, daysGranted, source = "crypto_payment" } = params;

  logger.info("Activating subscription", {
    userId,
    plan,
    daysGranted,
    source,
  });

  try {
    // 1. Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        planName: true,
        planExpiresAt: true,
        discordId: true,
        userSubscription: true,
      },
    });

    if (!user) {
      logger.error("User not found", { userId });
      return {
        success: false,
        error: `User not found: ${userId}`,
      };
    }

    const currentDate = new Date();

    // 2. Calculer la nouvelle date d'expiration
    let periodEnd: Date;
    const isExtension = !!(
      user.planExpiresAt && user.planExpiresAt > currentDate
    );

    if (isExtension && user.planExpiresAt) {
      // Étendre l'abonnement existant
      periodEnd = new Date(user.planExpiresAt);
      periodEnd.setDate(periodEnd.getDate() + daysGranted);
      logger.info("Extending existing subscription", {
        userId,
        currentExpiry: user.planExpiresAt,
        newExpiry: periodEnd,
      });
    } else {
      // Nouvel abonnement
      periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + daysGranted);
      logger.info("Creating new subscription", {
        userId,
        newExpiry: periodEnd,
      });
    }

    const periodStart = new Date();

    // 3. Update User planName et planExpiresAt
    await prisma.user.update({
      where: { id: userId },
      data: {
        planName: plan,
        planExpiresAt: periodEnd,
      },
    });

    logger.info("User plan updated", { userId, plan, periodEnd });

    // 3.1 Invalider le cache Next.js pour forcer le rafraîchissement
    // Wrapped in try-catch pour compatibilité E2E tests (pas de static generation store)
    try {
      revalidatePath("/", "layout");
    } catch (error) {
      // En contexte E2E, le static generation store n'existe pas
      // Ce n'est pas grave, les tests n'ont pas besoin de revalidation
      if (process.env.NODE_ENV !== "test") {
        logger.warn("revalidatePath failed (normal in E2E context)", { error });
      }
    }

    // 4. Upsert UserSubscription
    await prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: "active",
        periodStart,
        periodEnd,
        paymentMethod: "crypto",
      },
      update: {
        plan,
        status: "active",
        periodStart,
        periodEnd,
      },
    });

    logger.info("UserSubscription upserted", { userId, plan });

    // 4.5. Award upgrade bonus au trader referrer si applicable (non-bloquant)
    if (plan === "pro" || plan === "ultra") {
      void awardUpgradeBonus(userId, plan)
        .then((result) => {
          if (result.success) {
            logger.info("Upgrade bonus awarded to referrer", {
              inviteeId: userId,
              plan,
              creditsAwarded: result.creditsAwarded,
            });
          } else {
            // Log warning mais ne pas fail - peut être normal si pas d'invitation
            logger.info("No upgrade bonus awarded (no referrer found)", {
              inviteeId: userId,
              plan,
              reason: result.error,
            });
          }
        })
        .catch((err) => {
          logger.error("Error awarding upgrade bonus", {
            userId,
            plan,
            err,
          });
        });
    }

    // 5. Assigner rôle Discord (non-bloquant)
    await handleDiscordRoleAndNotification({ user, plan, periodEnd, userId });

    // 6. Envoyer email de confirmation (non-bloquant)
    void sendSubscriptionActivationEmail({
      user,
      plan,
      periodEnd,
      isExtension,
    }).catch((err) => {
      logger.error("Failed to send subscription activation email", {
        userId,
        err,
      });
    });

    logger.info("✅ Subscription activated successfully", {
      userId,
      plan,
      periodEnd,
    });

    return {
      success: true,
      periodEnd,
    };
  } catch (error) {
    logger.error("Error activating subscription", { userId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper: Gestion Discord role + notification
 */
async function handleDiscordRoleAndNotification(params: {
  user: { discordId: string | null };
  plan: MyCryptoPilotPlanName;
  periodEnd: Date;
  userId: string;
}): Promise<void> {
  const { user, plan, periodEnd, userId } = params;

  if (user.discordId) {
    void assignRoleToUser(user.discordId, plan)
      .then((success) => {
        if (success) {
          logger.info(
            `Discord role ${plan.toUpperCase()} assigned to user ${userId}`,
          );
        } else {
          logger.warn(`Failed to assign Discord role to user ${userId}`);
        }
      })
      .catch((err) => {
        logger.error("Error assigning Discord role", { userId, err });
      });

    // Envoyer DM Discord de confirmation (non-bloquant)
    void notifyPlanUpdated(user.discordId, plan, periodEnd)
      .then((success) => {
        if (success) {
          logger.info(`Discord DM sent to user ${userId} for plan update`);
        } else {
          logger.warn(`Failed to send Discord DM to user ${userId}`);
        }
      })
      .catch((err) => {
        logger.error("Error sending Discord DM notification", {
          userId,
          err,
        });
      });
  } else {
    logger.info("User has no Discord ID, skipping role assignment", {
      userId,
    });
  }
}

/**
 * Envoyer l'email de confirmation d'activation/renouvellement
 *
 * @param params - User et détails de l'abonnement
 */
async function sendSubscriptionActivationEmail(params: {
  user: {
    email: string;
    name: string;
  };
  plan: MyCryptoPilotPlanName;
  periodEnd: Date;
  isExtension: boolean;
}): Promise<void> {
  const { user, plan, periodEnd, isExtension } = params;

  const planDisplayName =
    plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Ultra";
  const actionVerb = isExtension ? "extended" : "activated";

  await sendEmail({
    to: user.email,
    subject: `Your ${planDisplayName} subscription has been ${actionVerb}`,
    html: SubscriptionActivationEmail({
      userName: user.name,
      plan,
      periodEnd,
      isExtension,
    }),
  });

  logger.info("Subscription activation email sent", {
    email: user.email,
    plan,
  });
}

/**
 * Envoyer un email d'avertissement d'expiration (à implémenter via cron)
 *
 * @param userId - User ID
 * @param daysRemaining - Nombre de jours restants
 */
export async function sendExpirationWarningEmail(
  userId: string,
  daysRemaining: number,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      planName: true,
      planExpiresAt: true,
    },
  });

  if (!user?.email || !user.planName || !user.planExpiresAt) {
    logger.warn("Cannot send expiration warning - user data incomplete", {
      userId,
    });
    return;
  }

  const planDisplayName =
    user.planName === "free"
      ? "Free"
      : user.planName === "pro"
        ? "Pro"
        : "Ultra";

  const markdownEN = `
# Your ${planDisplayName} subscription is expiring soon ⏰

Hello **${user.name}**,

Your **${planDisplayName}** plan will expire in **${daysRemaining} day${daysRemaining > 1 ? "s" : ""}**.

**Expiration date:** ${user.planExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

To continue enjoying ${planDisplayName} features, you can renew your subscription on [${SiteConfig.title}](${SiteConfig.prodUrl}/pricing).

[🔄 Renew my subscription](${SiteConfig.prodUrl}/pricing)
`;

  const markdownFR = `
# Ton abonnement ${planDisplayName} expire bientôt ⏰

Bonjour **${user.name}**,

Ton abonnement **${planDisplayName}** expirera dans **${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}**.

**Date d'expiration :** ${user.planExpiresAt.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}

Pour continuer à profiter des fonctionnalités ${planDisplayName}, tu peux renouveler ton abonnement sur [${SiteConfig.title}](${SiteConfig.prodUrl}/pricing).

[🔄 Renouveler mon abonnement](${SiteConfig.prodUrl}/pricing)
`;

  await sendEmail({
    to: user.email,
    subject: `Your ${planDisplayName} subscription expires in ${daysRemaining} days`,
    html: BilingualMarkdownEmail({
      markdownEN,
      markdownFR,
      preview: `Your subscription expires in ${daysRemaining} days - Ton abonnement expire dans ${daysRemaining} jours`,
    }),
  });

  logger.info("Expiration warning email sent", {
    userId,
    email: user.email,
    daysRemaining,
  });
}

/**
 * Downgrade un user vers FREE après expiration (à appeler via cron)
 *
 * @param userId - User ID
 */
export async function downgradeExpiredSubscription(
  userId: string,
): Promise<void> {
  logger.info("Downgrading expired subscription to FREE", { userId });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        planName: true,
        planExpiresAt: true,
        discordId: true,
        emailNotificationsEnabled: true,
        emailNotifySubscriptionReminders: true,
      },
    });

    if (!user) {
      logger.error("User not found for downgrade", { userId });
      return;
    }

    // Update vers FREE
    await prisma.user.update({
      where: { id: userId },
      data: {
        planName: "free",
        planExpiresAt: null,
      },
    });

    logger.info("User downgraded to FREE", { userId });

    // Assigner rôle Discord FREE (non-bloquant)
    if (user.discordId) {
      void assignRoleToUser(user.discordId, "free").catch((err) => {
        logger.error("Error assigning FREE Discord role after downgrade", {
          userId,
          err,
        });
      });
    }

    // Envoyer email de notification (non-bloquant)
    if (
      user.email &&
      user.emailNotificationsEnabled &&
      user.emailNotifySubscriptionReminders
    ) {
      const markdownEN = `
# Your subscription has expired

Hello **${user.name}**,

Your subscription has expired and your account has been downgraded to the **Free** plan.

**Free plan includes:**
- ✅ 5 trading signals per day
- ✅ Follow 1 trader
- ✅ Access to public marketplace

To regain access to premium features, you can upgrade anytime on [${SiteConfig.title}](${SiteConfig.prodUrl}/pricing).

[🚀 Upgrade now](${SiteConfig.prodUrl}/pricing)
`;

      const markdownFR = `
# Ton abonnement a expiré

Bonjour **${user.name}**,

Ton abonnement a expiré et ton compte a été rétrogradé vers le plan **Gratuit**.

**Le plan Gratuit inclut :**
- ✅ 5 signaux de trading par jour
- ✅ Suivre 1 trader
- ✅ Accès à la marketplace publique

Pour retrouver l'accès aux fonctionnalités premium, tu peux upgrader à tout moment sur [${SiteConfig.title}](${SiteConfig.prodUrl}/pricing).

[🚀 Upgrader maintenant](${SiteConfig.prodUrl}/pricing)
`;

      void sendEmail({
        to: user.email,
        subject: "Your subscription has expired",
        html: BilingualMarkdownEmail({
          markdownEN,
          markdownFR,
          preview: "Your subscription has expired - Ton abonnement a expiré",
        }),
      }).catch((err) => {
        logger.error("Failed to send downgrade email", { userId, err });
      });
    } else if (user.email) {
      logger.info("Skipping downgrade email (user preferences disabled)", {
        userId,
        email: user.email,
      });
    }

    logger.info("✅ Downgrade completed", { userId });
  } catch (error) {
    logger.error("Error downgrading subscription", { userId, error });
  }
}
