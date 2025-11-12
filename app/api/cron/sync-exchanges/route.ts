/**
 * API Route: Exchange Sync Cron Job
 *
 * GET /api/cron/sync-exchanges
 *
 * Executed periodically by Vercel Cron Jobs (every 5 minutes recommended)
 *
 * Actions:
 * 1. Fetch all active connections ready for sync (nextSyncAt <= now)
 * 2. Sync trades from exchanges (Binance)
 * 3. Update performance snapshots for each trader
 * 4. Handle errors gracefully (log + update lastSyncError)
 * 5. Schedule next sync based on plan (PRO=5min, ULTRA=1min)
 *
 * Protection:
 * - Verifies Authorization: Bearer ${CRON_SECRET}
 * - Returns 401 if secret invalid or absent
 *
 * Performance:
 * - Processes up to 50 connections per run (batch limit in getConnectionsToSync)
 * - 2s delay between syncs to avoid rate limiting
 * - Max duration: 60s (Vercel Hobby plan limit)
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/66
 * @see https://vercel.com/docs/cron-jobs
 */

import { route } from "@/lib/zod-route";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { runExchangeSyncCronJob } from "@/lib/cron/exchange-sync-job";

export const GET = route.handler(async (req) => {
  // Protection: Verify CRON_SECRET
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

  try {
    const result = await runExchangeSyncCronJob();

    return { ...result, timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error("=== Exchange sync cron job failed ===", {
      error,
    });

    throw new ZodRouteError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

// Configuration Vercel
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max (Hobby plan limit)
