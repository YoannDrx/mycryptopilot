/**
 * API Route: Refresh Unrealized PnL
 *
 * POST /api/trading/pnl/refresh
 *
 * Refreshes unrealized PnL calculations for a trader's open positions.
 * Bypasses cache to fetch fresh market prices and recalculate all PnL values.
 *
 * Use Cases:
 * - User clicks "Refresh" button in portfolio dashboard
 * - Periodic background updates
 * - After trade execution to update positions
 *
 * Features:
 * - Forces fresh price fetching (bypasses cache)
 * - Updates Redis cache with new calculations
 * - Returns updated PnL data for all open positions
 *
 * @example
 * POST /api/trading/pnl/refresh
 * Body: { traderProfileId: "profile_123" }
 * Response:
 * {
 *   success: true,
 *   positionsUpdated: 8,
 *   totalPnl: 1250.50,
 *   positions: [...]
 * }
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { refreshAllUnrealizedPnL } from "@/lib/trading/unrealized-pnl.service";

const BodySchema = z.object({
  traderProfileId: z.string(),
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

export const POST = authRoute
  .body(BodySchema)
  .handler(async (req, { body, ctx }) => {
    const { traderProfileId } = body;
    const userId = ctx.user.id;

    logger.info("Refreshing unrealized PnL", { userId, traderProfileId });

    try {
      // Verify trader profile belongs to user
      const traderProfile = await prisma.traderProfile.findUnique({
        where: { id: traderProfileId },
        select: { userId: true },
      });

      if (!traderProfile) {
        logger.error("Trader profile not found", { traderProfileId, userId });
        return {
          success: false,
          error: "Trader profile not found",
        };
      }

      if (traderProfile.userId !== userId) {
        logger.error("Unauthorized access to trader profile", {
          traderProfileId,
          userId,
        });
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      // Refresh all PnL calculations (bypasses cache by default)
      const positions = await refreshAllUnrealizedPnL(
        traderProfileId,
        fetchMarketPrice,
        false, // useCache = false to force fresh calculations
      );

      // Calculate totals
      const totalPnl = positions.reduce(
        (sum, pos) => sum + pos.unrealizedPnl,
        0,
      );

      logger.info("Unrealized PnL refreshed successfully", {
        traderProfileId,
        positionsUpdated: positions.length,
        totalPnl,
      });

      return {
        success: true,
        positionsUpdated: positions.length,
        totalPnl,
        positions,
      };
    } catch (error) {
      logger.error("Error refreshing unrealized PnL", {
        error,
        traderProfileId,
      });
      return {
        success: false,
        error: "Failed to refresh unrealized PnL",
      };
    }
  });
