import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/send-email";
import { assignRoleToUser } from "@/lib/discord/roles";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { SiteConfig } from "@/site-config";
import MarkdownEmail from "@email/markdown.email";

/**
 * Subscription Manager
 *
 * Module centralisé pour gérer le cycle de vie des abonnements MyCryptoPilot
 *
 * Responsabilités:
 * - Activer/étendre un abonnement (update User + Subscription)
 * - Assigner automatiquement le rôle Discord correspondant
 * - Envoyer les emails de notification (activation, renouvellement, expiration)
 *
 * Architecture:
 * - Appelé depuis payment-watcher.ts après confirmation de paiement crypto
 * - Appelé depuis admin actions pour gestion manuelle
 * - Utilise Discord roles.ts pour l'assignation automatique
 * - Utilise Resend pour les notifications email
 */

type SubscriptionActivationParams = {
  userId: string;
  plan: MyCryptoPilotPlanName;
  daysGranted: number;
  source?: "crypto_payment" | "admin" | "stripe_legacy";
};

type SubscriptionResult = {
  success: boolean;
  organizationId?: string;
  periodEnd?: Date;
  error?: string;
};

/**
 * Activer ou étendre l'abonnement d'un utilisateur
 *
 * Séquence complète:
 * 1. Update User.planName et User.planExpiresAt
 * 2. Upsert Subscription liée à l'Organization
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
    // 1. Récupérer l'utilisateur avec son organisation
    const membership = await prisma.member.findFirst({
      where: {
        userId,
        role: "owner",
      },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            planName: true,
            planExpiresAt: true,
            discordId: true,
          },
        },
      },
    });

    if (!membership) {
      logger.error("No organization found for user", { userId });
      return {
        success: false,
        error: `No organization found for user ${userId}`,
      };
    }

    const org = membership.organization;
    const user = membership.user;
    const currentDate = new Date();

    // 2. Calculer la nouvelle date d'expiration
    let periodEnd: Date;
    const isExtension = !!(user.planExpiresAt && user.planExpiresAt > currentDate);

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

    // 4. Upsert Subscription dans l'Organization
    await prisma.subscription.upsert({
      where: { referenceId: org.id },
      create: {
        id: `sub_${Date.now()}`,
        referenceId: org.id,
        plan,
        status: "active",
        periodStart,
        periodEnd,
      },
      update: {
        plan,
        status: "active",
        periodStart,
        periodEnd,
      },
    });

    logger.info("Subscription upserted", { organizationId: org.id, plan });

    // 5. Assigner rôle Discord (non-bloquant)
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
    } else {
      logger.info("User has no Discord ID, skipping role assignment", {
        userId,
      });
    }

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
      organizationId: org.id,
      plan,
      periodEnd,
    });

    return {
      success: true,
      organizationId: org.id,
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

  const markdown = `
# Subscription ${actionVerb === "extended" ? "Extended" : "Activated"} 🎉

Hi ${user.name},

Your **${planDisplayName}** plan has been successfully ${actionVerb}!

**Plan Details:**
- Plan: **${planDisplayName}**
- Valid until: **${periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}**

**What's included:**
${getPlanFeatures(plan)}

You can now access all ${planDisplayName} features on [${SiteConfig.title}](${SiteConfig.prodUrl}).

${user.email ? `If you have any questions, feel free to reply to this email.` : ""}
`;

  await sendEmail({
    to: user.email,
    subject: `Your ${planDisplayName} subscription has been ${actionVerb}`,
    html: MarkdownEmail({ markdown }),
  });

  logger.info("Subscription activation email sent", {
    email: user.email,
    plan,
  });
}

/**
 * Obtenir les features d'un plan pour l'email
 */
function getPlanFeatures(plan: MyCryptoPilotPlanName): string {
  switch (plan) {
    case "free":
      return `
- ✅ 5 trading signals per day
- ✅ Follow 1 trader
- ✅ Access to public marketplace
`;
    case "pro":
      return `
- ✅ 50 trading signals per day
- ✅ Follow up to 5 traders
- ✅ Risk console & trading journal
- ✅ 1-minute screener refresh
`;
    case "ultra":
      return `
- ✅ **Unlimited** trading signals
- ✅ Follow **unlimited** traders
- ✅ Advanced risk console & analytics
- ✅ 5-second screener refresh
- ✅ Custom alerts
- ✅ Priority support
`;
    default:
      return "";
  }
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

  const markdown = `
# Your ${planDisplayName} subscription is expiring soon ⏰

Hi ${user.name},

Your **${planDisplayName}** plan will expire in **${daysRemaining} day${daysRemaining > 1 ? "s" : ""}**.

**Expiration date:** ${user.planExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

To continue enjoying ${planDisplayName} features, you can renew your subscription on [${SiteConfig.title}](${SiteConfig.prodUrl}/pricing).

Don't lose access to:
${getPlanFeatures(user.planName as MyCryptoPilotPlanName)}
`;

  await sendEmail({
    to: user.email,
    subject: `Your ${planDisplayName} subscription expires in ${daysRemaining} days`,
    html: MarkdownEmail({ markdown }),
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
    if (user.email) {
      const markdown = `
# Your subscription has expired

Hi ${user.name},

Your subscription has expired and your account has been downgraded to the **Free** plan.

**Free plan includes:**
${getPlanFeatures("free")}

To regain access to premium features, you can upgrade anytime on [${SiteConfig.title}](${SiteConfig.prodUrl}/pricing).
`;

      void sendEmail({
        to: user.email,
        subject: "Your subscription has expired",
        html: MarkdownEmail({ markdown }),
      }).catch((err) => {
        logger.error("Failed to send downgrade email", { userId, err });
      });
    }

    logger.info("✅ Downgrade completed", { userId });
  } catch (error) {
    logger.error("Error downgrading subscription", { userId, error });
  }
}
