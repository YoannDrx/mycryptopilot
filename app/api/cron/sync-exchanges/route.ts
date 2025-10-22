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
import { getConnectionsToSync } from "@/features/exchange/exchange-queries";
import { syncMultipleConnections } from "@/lib/exchange/sync-service";

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

  logger.info("=== Starting exchange sync cron job ===");

  const startTime = Date.now();

  try {
    // 1. Fetch connections ready for sync
    const connections = await getConnectionsToSync();

    if (connections.length === 0) {
      logger.info("No connections to sync", {
        timestamp: new Date().toISOString(),
      });
      return {
        success: true,
        message: "No connections to sync",
        connectionsProcessed: 0,
        timestamp: new Date().toISOString(),
      };
    }

    logger.info("Found connections to sync", {
      count: connections.length,
    });

    // 2. Sync all connections
    const results = await syncMultipleConnections(connections);

    // 3. Calculate summary stats
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;
    const totalTradesImported = results.reduce(
      (sum, r) => sum + r.tradesImported,
      0,
    );
    const totalTradesFetched = results.reduce(
      (sum, r) => sum + r.tradesFetched,
      0,
    );

    const duration = Date.now() - startTime;

    logger.info("=== Exchange sync cron job completed ===", {
      connectionsProcessed: connections.length,
      successful: successCount,
      failed: failureCount,
      totalTradesImported,
      totalTradesFetched,
      durationMs: duration,
    });

    return {
      success: true,
      connectionsProcessed: connections.length,
      successful: successCount,
      failed: failureCount,
      totalTradesImported,
      totalTradesFetched,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("=== Exchange sync cron job failed ===", {
      error,
      durationMs: duration,
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
