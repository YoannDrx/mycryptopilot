/**
 * API Route: Expiration Reminders Cron Job
 *
 * GET /api/cron/expiration-reminders
 *
 * Exécuté quotidiennement à 9h UTC par Vercel Cron Jobs
 *
 * Actions:
 * 1. Envoie des rappels d'expiration aux users (7j, 3j, 1j avant expiration)
 * 2. Downgrade automatiquement les abonnements expirés vers FREE
 * 3. Envoie emails ET DMs Discord
 * 4. Update les rôles Discord automatiquement
 *
 * Protection:
 * - Vérifie le header Authorization: Bearer ${CRON_SECRET}
 * - Retourne 401 si secret invalide ou absent
 *
 * Améliorations (Phase 5 - Discord Integration):
 * - Ajout rappel 7 jours (préavis supplémentaire)
 * - Utilisation template email React professionnel
 * - Maintien DMs Discord (engagement utilisateur)
 * - Migration vers zod-route pattern (validation stricte)
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { route } from "@/lib/zod-route";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { runExpirationReminderJob } from "@/lib/cron/expiration-reminder-job";
import { ZodRouteError } from "@/lib/errors/zod-route-error";

export const GET = route.handler(async (req) => {
  // Protection: Vérifier le CRON_SECRET
  const authHeader = req.headers.get("Authorization");
  const expectedSecret = env.CRON_SECRET;

  if (!expectedSecret) {
    logger.error("CRON_SECRET not configured in environment variables");
    throw new ZodRouteError("Cron jobs not configured", 500);
  }

  // Format: "Bearer <secret>"
  const token = authHeader?.replace("Bearer ", "");

  if (token !== expectedSecret) {
    logger.warn("Unauthorized cron job attempt", {
      receivedToken: `${token?.slice(0, 10)}...`,
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
    throw new ZodRouteError("Unauthorized", 401);
  }

  logger.info("=== Starting expiration reminders cron job ===");

  try {
    // Exécuter le job complet (7j, 3j, 1j reminders + downgrades)
    const result = await runExpirationReminderJob();

    if (!result.success) {
      throw new ZodRouteError(result.error ?? "Unknown error", 500);
    }

    logger.info("=== Expiration reminders cron job completed ===", result);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results: result.results,
    };
  } catch (error) {
    logger.error("=== Expiration reminders cron job failed ===", error);

    throw new ZodRouteError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

// Configuration Vercel (export runtime edge ou node)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 secondes max (Hobby plan limit)
