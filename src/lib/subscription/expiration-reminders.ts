import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail/send-email";
import {
  notifyExpirationReminder,
  notifyDowngradeToFree,
} from "@/lib/discord/dm-notifications";
import { SiteConfig } from "@/site-config";
import MarkdownEmail from "@email/markdown.email";

/**
 * Expiration Reminders
 *
 * Système de rappels automatiques pour les abonnements qui expirent bientôt.
 * Envoie des notifications Discord DM et/ou Email aux utilisateurs.
 *
 * @module expiration-reminders
 */

type ReminderType = "3_DAYS" | "1_DAY" | "EXPIRED";

/**
 * Obtenir tous les utilisateurs dont l'abonnement expire dans X jours
 *
 * @param daysBeforeExpiration - Nombre de jours avant expiration
 * @returns Liste des utilisateurs avec expiration proche
 */
async function getUsersWithExpiringSubscriptions(
  daysBeforeExpiration: number,
): Promise<
  {
    id: string;
    email: string;
    name: string;
    planName: string | null;
    planExpiresAt: Date | null;
    discordId: string | null;
  }[]
> {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiration);

  // Définir la plage: début et fin du jour cible
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const users = await prisma.user.findMany({
    where: {
      planName: {
        in: ["pro", "ultra"], // Seulement plans payants
      },
      planExpiresAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      planName: true,
      planExpiresAt: true,
      discordId: true,
    },
  });

  logger.info(
    `Found ${users.length} users with subscription expiring in ${daysBeforeExpiration} days`,
  );

  return users;
}

/**
 * Obtenir tous les utilisateurs dont l'abonnement a expiré (downgrade automatique)
 *
 * @returns Liste des utilisateurs avec abonnement expiré
 */
async function getUsersWithExpiredSubscriptions(): Promise<
  {
    id: string;
    email: string;
    name: string;
    planName: string | null;
    planExpiresAt: Date | null;
    discordId: string | null;
  }[]
> {
  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      planName: {
        in: ["pro", "ultra"], // Plans payants qui ont expiré
      },
      planExpiresAt: {
        lt: now, // Expiré
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      planName: true,
      planExpiresAt: true,
      discordId: true,
    },
  });

  logger.info(`Found ${users.length} users with expired subscriptions`);

  return users;
}

/**
 * Envoyer un email de rappel d'expiration
 *
 * @param params - User et type de rappel
 */
async function sendExpirationReminderEmail(params: {
  user: {
    email: string;
    name: string;
    planName: string | null;
  };
  daysLeft: number;
  expiresAt: Date;
}): Promise<void> {
  const { user, daysLeft, expiresAt } = params;

  const planDisplayName =
    user.planName === "pro"
      ? "Pro"
      : user.planName === "ultra"
        ? "Ultra"
        : "Free";

  const urgencyText =
    daysLeft === 3 ? "dans 3 jours" : daysLeft === 1 ? "demain" : "bientôt";

  const markdown = `
# ⏰ Ton abonnement ${planDisplayName} expire ${urgencyText}

Bonjour ${user.name},

Ton abonnement **${planDisplayName}** expire le **${expiresAt.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}**.

**Il te reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""} pour renouveler et continuer à profiter de tes avantages** ! 🚀

## 📊 Rappel de tes avantages ${planDisplayName}

${getPlanFeatures(user.planName as "free" | "pro" | "ultra")}

## 🔄 Comment renouveler ?

1. Visite notre [page de pricing](${SiteConfig.prodUrl}/pricing)
2. Sélectionne ton plan **${planDisplayName}**
3. Effectue le paiement en crypto (USDC ou USDT)
4. Ton accès est renouvelé automatiquement ! ✅

## ⚠️ Que se passe-t-il après expiration ?

Si tu ne renouvelles pas avant l'expiration :
- Ton compte sera downgraded vers le plan **Free**
- Tu perdras l'accès aux fonctionnalités premium
- Tes données seront conservées (tu peux upgrader à tout moment)

## 💬 Besoin d'aide ?

Notre équipe est disponible sur [Discord](${SiteConfig.prodUrl}/discord) pour toute question.

À bientôt sur ${SiteConfig.title} !
`;

  await sendEmail({
    to: user.email,
    subject: `⏰ Ton abonnement ${planDisplayName} expire ${urgencyText}`,
    html: MarkdownEmail({ markdown }),
  });

  logger.info(`Expiration reminder email sent to ${user.email}`);
}

/**
 * Envoyer un DM Discord de rappel d'expiration
 *
 * @param params - Discord ID et détails du rappel
 */
async function sendExpirationReminderDM(params: {
  discordId: string;
  planName: string;
  daysLeft: number;
  expiresAt: Date;
}): Promise<boolean> {
  const { discordId, planName, daysLeft, expiresAt } = params;

  logger.info(
    `Sending expiration reminder DM to Discord user ${discordId}: ${planName} expires in ${daysLeft} days`,
  );

  return notifyExpirationReminder(discordId, planName, daysLeft, expiresAt);
}

/**
 * Downgrader automatiquement un utilisateur vers le plan FREE
 *
 * @param userId - User ID
 */
async function downgradeToFree(userId: string): Promise<void> {
  logger.info(`Downgrading user ${userId} to FREE plan (subscription expired)`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      planName: "free",
      planExpiresAt: null,
    },
  });

  logger.info(`User ${userId} downgraded to FREE plan`);
}

/**
 * Envoyer un email de downgrade automatique
 *
 * @param params - User
 */
async function sendDowngradeNotificationEmail(params: {
  user: {
    email: string;
    name: string;
  };
  oldPlan: string;
}): Promise<void> {
  const { user, oldPlan } = params;

  const planDisplayName = oldPlan === "pro" ? "Pro" : "Ultra";

  const markdown = `
# ℹ️ Ton abonnement ${planDisplayName} a expiré

Bonjour ${user.name},

Ton abonnement **${planDisplayName}** a expiré. Ton compte a été automatiquement downgraded vers le plan **Free**.

## 🆓 Plan Free

Tu peux continuer à utiliser ${SiteConfig.title} avec les fonctionnalités suivantes :
• 5 signaux par jour
• 1 trader à suivre
• Screener avec refresh toutes les 5 minutes

## 🔄 Reprendre un abonnement

Tu peux upgrader à tout moment vers un plan payant pour récupérer l'accès aux fonctionnalités premium :

💎 **Plan Pro - 49$/mois**
• 50 signaux par jour
• Jusqu'à 5 traders
• Console de risque & Journal de trading

🚀 **Plan Ultra - 99$/mois**
• Signaux illimités
• Traders illimités
• Alertes custom & Filtres avancés

[Voir les plans](${SiteConfig.prodUrl}/pricing)

Merci d'avoir utilisé ${SiteConfig.title} ! 🙏
`;

  await sendEmail({
    to: user.email,
    subject: `ℹ️ Ton abonnement ${planDisplayName} a expiré`,
    html: MarkdownEmail({ markdown }),
  });

  logger.info(`Downgrade notification email sent to ${user.email}`);
}

/**
 * Traiter les rappels d'expiration pour une période donnée
 *
 * @param reminderType - Type de rappel ("3_DAYS" | "1_DAY" | "EXPIRED")
 */
export async function processExpirationReminders(
  reminderType: ReminderType,
): Promise<{
  processed: number;
  emailsSent: number;
  dmsSent: number;
  downgrades: number;
}> {
  logger.info(`Processing ${reminderType} expiration reminders...`);

  let users: Awaited<ReturnType<typeof getUsersWithExpiringSubscriptions>> = [];
  let daysLeft = 0;

  if (reminderType === "3_DAYS") {
    users = await getUsersWithExpiringSubscriptions(3);
    daysLeft = 3;
  } else if (reminderType === "1_DAY") {
    users = await getUsersWithExpiringSubscriptions(1);
    daysLeft = 1;
  } else {
    // reminderType === "EXPIRED"
    users = await getUsersWithExpiredSubscriptions();
    daysLeft = 0;
  }

  let emailsSent = 0;
  let dmsSent = 0;
  let downgrades = 0;

  if (reminderType === "EXPIRED") {
    // Traiter les downgrades en parallèle
    await Promise.all(
      users.map(async (user) => {
        const oldPlan = user.planName ?? "free";

        // Downgrader vers FREE
        await downgradeToFree(user.id);
        downgrades++;

        // Envoyer notification downgrade (non-bloquant)
        void sendDowngradeNotificationEmail({
          user: {
            email: user.email,
            name: user.name,
          },
          oldPlan,
        }).catch((err) => {
          logger.error("Error sending downgrade notification email", {
            userId: user.id,
            err,
          });
        });
        emailsSent++;

        // Envoyer DM Discord de downgrade (non-bloquant)
        if (user.discordId) {
          void notifyDowngradeToFree(user.discordId, oldPlan).catch((err) => {
            logger.error("Error sending downgrade DM", {
              userId: user.id,
              err,
            });
          });
          dmsSent++;
        }
      }),
    );
  } else {
    // Rappels d'expiration (3 jours ou 1 jour)
    for (const user of users) {
      if (!user.planExpiresAt) continue;

      // Envoyer email de rappel (non-bloquant)
      void sendExpirationReminderEmail({
        user: {
          email: user.email,
          name: user.name,
          planName: user.planName,
        },
        daysLeft,
        expiresAt: user.planExpiresAt,
      }).catch((err) => {
        logger.error("Error sending expiration reminder email", {
          userId: user.id,
          err,
        });
      });
      emailsSent++;

      // Envoyer DM Discord de rappel (non-bloquant)
      if (user.discordId && user.planName) {
        void sendExpirationReminderDM({
          discordId: user.discordId,
          planName: user.planName,
          daysLeft,
          expiresAt: user.planExpiresAt,
        }).catch((err) => {
          logger.error("Error sending expiration reminder DM", {
            userId: user.id,
            err,
          });
        });
        dmsSent++;
      }
    }
  }

  logger.info(
    `${reminderType} reminders processed: ${users.length} users, ${emailsSent} emails, ${dmsSent} DMs, ${downgrades} downgrades`,
  );

  return {
    processed: users.length,
    emailsSent,
    dmsSent,
    downgrades,
  };
}

/**
 * Helper: Obtenir les features d'un plan
 */
function getPlanFeatures(plan: "free" | "pro" | "ultra"): string {
  const features = {
    free: `• 5 signaux par jour
• 1 trader à suivre
• Screener refresh 5min`,
    pro: `• 50 signaux par jour
• Jusqu'à 5 traders à suivre
• Console de risque & Journal de trading
• Screener refresh 1min`,
    ultra: `• Signaux illimités
• Traders illimités à suivre
• Console de risque & Journal de trading
• Alertes custom & Filtres avancés
• Screener refresh 5sec`,
  };

  return features[plan];
}
