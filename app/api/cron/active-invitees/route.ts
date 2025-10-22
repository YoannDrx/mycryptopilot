/**
 * API Route: Active Invitees Cron Job
 *
 * GET /api/cron/active-invitees
 *
 * Exécuté quotidiennement à 2h UTC par Vercel Cron Jobs
 *
 * Actions:
 * 1. Trouve toutes les invitations acceptées depuis 30+ jours
 * 2. Vérifie si l'invité est encore actif (connecté dans les 7 derniers jours)
 * 3. Award le bonus "active 30 days" au trader (+10 credits)
 * 4. Marque l'invitation comme inviteeActive = true
 *
 * Protection:
 * - Vérifie le header Authorization: Bearer ${CRON_SECRET}
 * - Retourne 401 si secret invalide ou absent
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { route } from "@/lib/zod-route";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { runActiveInviteesJob } from "@/lib/cron/active-invitees-job";
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

  logger.info("=== Starting active invitees cron job ===");

  try {
    // Exécuter le job complet
    const result = await runActiveInviteesJob();

    if (!result.success) {
      throw new ZodRouteError(result.error ?? "Unknown error", 500);
    }

    logger.info("=== Active invitees cron job completed ===", result);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results: result.results,
    };
  } catch (error) {
    logger.error("=== Active invitees cron job failed ===", error);

    throw new ZodRouteError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

// Configuration Vercel (export runtime edge ou node)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 secondes max (Hobby plan limit)
