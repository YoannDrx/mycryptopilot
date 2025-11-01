/**
 * API Route: Get Total Unrealized PnL for Trader
 *
 * GET /api/trading/pnl/trader/[traderProfileId]
 *
 * Returns aggregated unrealized PnL for all open positions of a trader.
 * Uses Redis caching for performance optimization.
 *
 * Features:
 * - Calculates PnL for all open trades in batch
 * - Returns total PnL and breakdown by position
 * - Includes statistics (positive/negative positions count)
 * - Supports cache bypass for fresh data
 *
 * @example
 * GET /api/trading/pnl/trader/profile_123
 * Response:
 * {
 *   totalUnrealizedPnl: 1250.50,
 *   openPositionsCount: 8,
 *   positivePnlCount: 5,
 *   negativePnlCount: 3,
 *   positions: [...]
 * }
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getTotalUnrealizedPnL } from "@/lib/trading/unrealized-pnl.service";

const ParamsSchema = z.object({
  traderProfileId: z.string(),
});

const QuerySchema = z.object({
  useCache: z.enum(["true", "false"]).optional().default("true"),
});

/**
 * Price fetcher using ccxt directly for real-time market data
 */
async function fetchMarketPrice(symbol: string): Promise<number> {
  try {
    // Use ccxt directly for public market data (no API keys needed)
    const ccxt = await import("ccxt");
    const exchange = new ccxt.binance({
      enableRateLimit: true,
    });

    // Fetch ticker (current market price)
    const ticker = await exchange.fetchTicker(symbol);

    if (!ticker.last) {
      throw new Error(`No price data for symbol ${symbol}`);
    }

    return ticker.last;
  } catch (error) {
    logger.error("Failed to fetch market price", { symbol, error });
    throw new Error(`Failed to fetch price for ${symbol}`);
  }
}

export const GET = authRoute
  .params(ParamsSchema)
  .query(QuerySchema)
  .handler(async (req, { params, query, ctx }) => {
    const { traderProfileId } = params;
    const useCache = query.useCache === "true";
    const userId = ctx.user.id;

    logger.info("Fetching total unrealized PnL", {
      userId,
      traderProfileId,
      useCache,
    });

    try {
      // Verify trader profile belongs to user
      const traderProfile = await prisma.traderProfile.findUnique({
        where: { id: traderProfileId },
        select: { userId: true },
      });

      if (!traderProfile) {
        logger.error("Trader profile not found", { traderProfileId, userId });
        return {
          error: "Trader profile not found",
        };
      }

      if (traderProfile.userId !== userId) {
        logger.error("Unauthorized access to trader profile", {
          traderProfileId,
          userId,
        });
        return {
          error: "Unauthorized",
        };
      }

      // Calculate total unrealized PnL with all positions
      const result = await getTotalUnrealizedPnL(
        traderProfileId,
        fetchMarketPrice,
        useCache,
      );

      logger.info("Total unrealized PnL calculated", {
        traderProfileId,
        totalPnl: result.totalUnrealizedPnl,
        positionsCount: result.openPositionsCount,
      });

      return result;
    } catch (error) {
      logger.error("Error calculating total unrealized PnL", {
        error,
        traderProfileId,
      });
      return {
        error: "Failed to calculate total unrealized PnL",
      };
    }
  });
