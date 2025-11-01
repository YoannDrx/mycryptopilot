/**
 * API Route: Get Unrealized PnL for a Trade
 *
 * GET /api/trading/pnl/[tradeId]
 *
 * Returns real-time unrealized PnL for a single open trade.
 * Uses Redis caching with 30-second TTL for performance.
 *
 * Features:
 * - Fetches current market price (cached 60s)
 * - Calculates PnL based on position side (BUY/SELL)
 * - Subtracts trading fees
 * - Returns fromCache flag indicating data freshness
 *
 * @example
 * GET /api/trading/pnl/trade_123
 * Response:
 * {
 *   tradeId: "trade_123",
 *   symbol: "BTCUSDT",
 *   side: "BUY",
 *   quantity: 0.5,
 *   entryPrice: 45000,
 *   currentPrice: 46000,
 *   unrealizedPnl: 500,
 *   unrealizedPnlPercent: 2.22,
 *   fromCache: true
 * }
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { updateTradeUnrealizedPnL } from "@/lib/trading/unrealized-pnl.service";

const ParamsSchema = z.object({
  tradeId: z.string(),
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
    const { tradeId } = params;
    const useCache = query.useCache === "true";
    const userId = ctx.user.id;

    logger.info("Fetching unrealized PnL", { userId, tradeId, useCache });

    try {
      // Verify trade belongs to user's trader profile
      const trade = await prisma.traderTrade.findUnique({
        where: { id: tradeId },
      });

      if (!trade) {
        logger.error("Trade not found", { tradeId, userId });
        return {
          error: "Trade not found",
        };
      }

      // Verify ownership by checking trader profile
      const traderProfile = await prisma.traderProfile.findUnique({
        where: { id: trade.traderProfileId },
        select: { userId: true },
      });

      if (!traderProfile || traderProfile.userId !== userId) {
        logger.error("Unauthorized access to trade", { tradeId, userId });
        return {
          error: "Unauthorized",
        };
      }

      if (trade.status !== "OPEN") {
        logger.error("Cannot calculate PnL for closed trade", {
          tradeId,
          status: trade.status,
        });
        return {
          error: "Trade is not open",
        };
      }

      // Calculate unrealized PnL with caching
      const pnlResult = await updateTradeUnrealizedPnL(
        tradeId,
        fetchMarketPrice,
        useCache,
      );

      logger.info("Unrealized PnL calculated", {
        tradeId,
        pnl: pnlResult.unrealizedPnl,
        fromCache: pnlResult.fromCache,
      });

      return pnlResult;
    } catch (error) {
      logger.error("Error calculating unrealized PnL", { error, tradeId });
      return {
        error: "Failed to calculate unrealized PnL",
      };
    }
  });
