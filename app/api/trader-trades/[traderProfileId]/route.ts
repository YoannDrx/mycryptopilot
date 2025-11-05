/**
 * API Route: Get Trader Trades
 *
 * GET /api/trader-trades/[traderProfileId]
 *
 * Returns list of trades (aggregated from exchanges + manual) for a trader.
 * Supports filtering by status, source, symbol.
 *
 * Query params:
 * - status: OPEN | CLOSED | PARTIAL (can be comma-separated)
 * - source: BINANCE | BYBIT | MANUAL (can be comma-separated)
 * - symbol: BTC/USDT, ETH/USDT, etc.
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  getTraderTrades,
  countTraderTrades,
  type GetTraderTradesFilters,
} from "@/lib/trading/trader-trade-queries";

const TradeStatusSchema = z.enum(["OPEN", "CLOSED", "PARTIAL"]);
const TradeSourceSchema = z.enum(["BINANCE", "BYBIT", "MANUAL"]);

export const GET = authRoute
  .params(
    z.object({
      traderProfileId: z.string().cuid(),
    }),
  )
  .query(
    z.object({
      status: z.string().optional(),
      source: z.string().optional(),
      symbol: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
      offset: z.coerce.number().min(0).optional(),
    }),
  )
  .handler(async (req, { params, query, ctx }) => {
    const { traderProfileId } = params;
    const { status, source, symbol, limit, offset } = query;
    const userId = ctx.user.id;

    logger.info("Fetching trader trades", {
      userId,
      traderProfileId,
      status,
      source,
      symbol,
      limit,
      offset,
    });

    // Verify trader profile belongs to user
    const { prisma } = await import("@/lib/prisma");
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { id: traderProfileId },
      select: { userId: true },
    });

    if (!traderProfile) {
      logger.warn("Trader profile not found", {
        userId,
        traderProfileId,
      });
      return { trades: [], total: 0 };
    }

    if (traderProfile.userId !== userId) {
      logger.warn("Unauthorized access to trader trades", {
        userId,
        requestedTraderUserId: traderProfile.userId,
        traderProfileId,
      });
      throw new Error("Unauthorized");
    }

    // Parse filters
    const filters: GetTraderTradesFilters = {
      limit,
      offset,
    };

    if (status) {
      const statuses = status.split(",");
      filters.status =
        statuses.length === 1
          ? TradeStatusSchema.parse(statuses[0])
          : statuses.map((s) => TradeStatusSchema.parse(s));
    }

    if (source) {
      const sources = source.split(",");
      filters.source =
        sources.length === 1
          ? TradeSourceSchema.parse(sources[0])
          : sources.map((s) => TradeSourceSchema.parse(s));
    }

    if (symbol) {
      filters.symbol = symbol;
    }

    // Fetch trades and count
    const [trades, total] = await Promise.all([
      getTraderTrades(traderProfileId, filters),
      countTraderTrades(traderProfileId, {
        status: filters.status,
        source: filters.source,
        symbol: filters.symbol,
      }),
    ]);

    logger.info("Trader trades fetched successfully", {
      userId,
      traderProfileId,
      tradesCount: trades.length,
      total,
    });

    // Convert Decimal fields to numbers for JSON serialization
    return {
      trades: trades.map((trade) => ({
        id: trade.id,
        traderProfileId: trade.traderProfileId,
        source: trade.source,
        instrumentType: trade.instrumentType,
        symbol: trade.symbol,
        status: trade.status,
        side: trade.side,
        totalQuantity: Number(trade.totalQuantity),
        averageEntry: Number(trade.averageEntry),
        averageExit: trade.averageExit ? Number(trade.averageExit) : null,
        stopLoss: trade.stopLoss ? Number(trade.stopLoss) : null,
        takeProfit: trade.takeProfit,
        realizedPnl: trade.realizedPnl ? Number(trade.realizedPnl) : null,
        fees: Number(trade.fees),
        notes: trade.notes,
        openedAt: trade.openedAt.toISOString(),
        closedAt: trade.closedAt?.toISOString() ?? null,
        lastActivityAt: trade.lastActivityAt.toISOString(),
        createdAt: trade.createdAt.toISOString(),
        updatedAt: trade.updatedAt.toISOString(),
        fills: trade.fills.map((fill) => ({
          id: fill.id,
          externalOrderId: fill.externalOrderId,
          executedAt: fill.executedAt.toISOString(),
        })),
      })),
      total,
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
    };
  });
