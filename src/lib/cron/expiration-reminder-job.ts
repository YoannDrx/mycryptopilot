import { logger } from "@/lib/logger";
import { processExpirationReminders } from "@/lib/subscription/expiration-reminders";

/**
 * Cron Job: Expiration Reminders
 *
 * Ce job doit être exécuté quotidiennement pour:
 * 1. Envoyer des rappels 3 jours avant expiration
 * 2. Envoyer des rappels 1 jour avant expiration
 * 3. Downgrader automatiquement les abonnements expirés vers FREE
 *
 * Recommandation: Exécuter à 9h00 UTC chaque jour via Vercel Cron ou service externe
 *
 * @example
 * // Dans vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expiration-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function runExpirationReminderJob(): Promise<{
  success: boolean;
  results: {
    threeDays: { processed: number; emailsSent: number; dmsSent: number };
    oneDay: { processed: number; emailsSent: number; dmsSent: number };
    expired: {
      processed: number;
      emailsSent: number;
      dmsSent: number;
      downgrades: number;
    };
  };
  error?: string;
}> {
  logger.info("Starting expiration reminder cron job");

  try {
    // 1. Traiter les rappels 3 jours avant expiration
    const threeDaysResults = await processExpirationReminders("3_DAYS");
    logger.info("3-day reminders completed", threeDaysResults);

    // 2. Traiter les rappels 1 jour avant expiration
    const oneDayResults = await processExpirationReminders("1_DAY");
    logger.info("1-day reminders completed", oneDayResults);

    // 3. Traiter les abonnements expirés (downgrade automatique)
    const expiredResults = await processExpirationReminders("EXPIRED");
    logger.info("Expired subscriptions processed", expiredResults);

    const totalProcessed =
      threeDaysResults.processed +
      oneDayResults.processed +
      expiredResults.processed;
    const totalEmails =
      threeDaysResults.emailsSent +
      oneDayResults.emailsSent +
      expiredResults.emailsSent;
    const totalDMs =
      threeDaysResults.dmsSent + oneDayResults.dmsSent + expiredResults.dmsSent;
    const totalDowngrades = expiredResults.downgrades;

    logger.info("✅ Expiration reminder job completed successfully", {
      totalProcessed,
      totalEmails,
      totalDMs,
      totalDowngrades,
    });

    return {
      success: true,
      results: {
        threeDays: threeDaysResults,
        oneDay: oneDayResults,
        expired: expiredResults,
      },
    };
  } catch (error) {
    logger.error("❌ Expiration reminder job failed", { error });
    return {
      success: false,
      results: {
        threeDays: { processed: 0, emailsSent: 0, dmsSent: 0 },
        oneDay: { processed: 0, emailsSent: 0, dmsSent: 0 },
        expired: { processed: 0, emailsSent: 0, dmsSent: 0, downgrades: 0 },
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
