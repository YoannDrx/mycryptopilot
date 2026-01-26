/**
 * API Route: Force Manual Sync
 *
 * POST /api/exchange/[id]/sync
 *
 * Triggers manual synchronization of exchange trades:
 * - Verifies ownership
 * - Checks rate limiting based on plan (PRO=5min, ULTRA=1min)
 * - Runs the sync immediately (no cron dependency)
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/66
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getExchangeConnectionById } from "@/features/exchange/exchange-queries";
import { getSyncInterval } from "@/features/exchange/exchange-plan-limits";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import {
  syncConnectionTrades,
  type ConnectionWithPlan,
} from "@/lib/exchange/sync-service";

export const POST = authRoute
  .params(
    z.object({
      id: z.string().cuid(),
    }),
  )
  .handler(async (req, { params, ctx }) => {
    const { id: connectionId } = params;
    const userId = ctx.user.id;

    logger.info("Manual sync requested", {
      userId,
      connectionId,
    });

    // Fetch connection with trader info (includes plan)
    const connection = await getExchangeConnectionById(connectionId);

    if (!connection) {
      throw new ZodRouteError("Connection not found", 404);
    }

    // Verify ownership
    if (connection.trader.userId !== userId) {
      logger.warn("Unauthorized sync attempt", {
        userId,
        connectionId,
        ownerId: connection.trader.userId,
      });
      throw new ZodRouteError("Unauthorized", 403);
    }

    // Check if connection is active
    if (!connection.isActive) {
      throw new ZodRouteError(
        "Cannot sync inactive connection. Reconnect first.",
        400,
      );
    }

    // Get sync interval for rate limiting
    const planName = connection.trader.user.planName;
    const syncIntervalMinutes = getSyncInterval(planName);

    if (syncIntervalMinutes === 0) {
      throw new ZodRouteError("Manual sync requires Pro or Ultra plan", 403);
    }

    // Check rate limiting: has enough time passed since last sync?
    if (connection.lastSyncedAt) {
      const timeSinceLastSync = Date.now() - connection.lastSyncedAt.getTime();
      const cooldownMs = syncIntervalMinutes * 60 * 1000;

      if (timeSinceLastSync < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastSync;
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        logger.info("Sync rate limited", {
          userId,
          connectionId,
          remainingMinutes,
        });

        throw new ZodRouteError(
          `Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""} before syncing again`,
          429,
        );
      }
    }

    // Run sync immediately instead of waiting for cron
    const syncResult = await syncConnectionTrades(
      connection as ConnectionWithPlan,
    );

    if (!syncResult.success) {
      logger.error("Manual sync failed", {
        userId,
        connectionId,
        exchange: connection.exchange,
        error: syncResult.error,
      });

      throw new ZodRouteError(
        syncResult.error ?? "Failed to sync trades",
        500,
      );
    }

    logger.info("Manual sync completed successfully", {
      userId,
      connectionId,
      exchange: connection.exchange,
      tradesImported: syncResult.tradesImported,
    });

    return {
      success: true,
      message: `${connection.exchange} synced. Imported ${syncResult.tradesImported} trade${syncResult.tradesImported === 1 ? "" : "s"}.`,
      exchange: connection.exchange,
      lastSyncedAt: new Date().toISOString(),
    };
  });
