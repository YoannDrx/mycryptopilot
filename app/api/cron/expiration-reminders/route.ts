import { runExpirationReminderJob } from "@/lib/cron/expiration-reminder-job";
import { logger } from "@/lib/logger";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

/**
 * Cron Route: Expiration Reminders
 *
 * Cette route API doit être appelée quotidiennement par un service cron externe.
 *
 * Configuration Vercel Cron (vercel.json):
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/expiration-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 * ```
 *
 * Sécurité: Protégé par CRON_SECRET (recommandé)
 *
 * @example
 * // Test manuel:
 * curl -X GET https://mycryptopilot.com/api/cron/expiration-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  logger.info("Expiration reminders cron endpoint called");

  // Sécurité: Vérifier le secret cron (optionnel mais recommandé)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron request attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
  } else {
    logger.warn(
      "CRON_SECRET not configured - cron endpoint is not protected!",
    );
  }

  // Exécuter le job
  const result = await runExpirationReminderJob();

  if (result.success) {
    return NextResponse.json(
      {
        success: true,
        message: "Expiration reminders processed successfully",
        results: result.results,
      },
      { status: 200 },
    );
  } else {
    return NextResponse.json(
      {
        success: false,
        message: "Expiration reminders job failed",
        error: result.error,
      },
      { status: 500 },
    );
  }
}
