/**
 * API Route: Get Exchange Connection Status
 *
 * GET /api/exchange/[id]/status
 *
 * Returns detailed status of an exchange connection:
 * - Connection details (exchange, active status, sync times)
 * - Trade statistics (total trades, date range)
 * - Last sync error (if any)
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/66
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  getExchangeConnectionById,
  getConnectionTradeStats,
} from "@/features/exchange/exchange-queries";
import { ZodRouteError } from "@/lib/errors/zod-route-error";

export const GET = authRoute
  .params(
    z.object({
      id: z.string().cuid(),
    }),
  )
  .handler(async (req, { params, ctx }) => {
    const { id: connectionId } = params;
    const userId = ctx.user.id;

    logger.info("Fetching exchange connection status", {
      userId,
      connectionId,
    });

    // Fetch connection with trader info
    const connection = await getExchangeConnectionById(connectionId);

    if (!connection) {
      throw new ZodRouteError("Connection not found", 404);
    }

    // Verify ownership
    if (connection.trader.userId !== userId) {
      logger.warn("Unauthorized access to exchange connection", {
        userId,
        connectionId,
        ownerId: connection.trader.userId,
      });
      throw new ZodRouteError("Unauthorized", 403);
    }

    // Get trade statistics
    const stats = await getConnectionTradeStats(connectionId);

    return {
      connection: {
        id: connection.id,
        exchange: connection.exchange,
        isActive: connection.isActive,
        lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
        nextSyncAt: connection.nextSyncAt?.toISOString() ?? null,
        lastSyncError: connection.lastSyncError ?? null,
        createdAt: connection.createdAt.toISOString(),
      },
      stats: {
        totalTrades: stats.totalTrades,
        firstTradeDate: stats.firstTradeDate?.toISOString() ?? null,
        lastTradeDate: stats.lastTradeDate?.toISOString() ?? null,
      },
    };
  });
