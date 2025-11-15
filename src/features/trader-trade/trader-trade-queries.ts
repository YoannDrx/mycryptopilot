/**
 * TraderTrade Query Functions
 *
 * Database queries for trader trades (positions).
 * Used for fetching trade data without mutations.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { TraderTrade, Signal, CopyTrade } from "@/generated/prisma";
import {
  serializeTraderTrade,
  type SerializableTraderTrade,
} from "./trader-trade-serializer";

export async function getTraderTrades(
  traderProfileId: string,
  filters?: {
    status?: "OPEN" | "CLOSED" | "PARTIAL";
    source?: "BINANCE" | "BYBIT" | "BITGET" | "MANUAL";
    symbol?: string;
    limit?: number;
    orderBy?: "openedAt" | "closedAt" | "realizedPnl";
    orderDir?: "asc" | "desc";
  },
): Promise<SerializableTraderTrade[]> {
  const where: {
    traderProfileId: string;
    status?: "OPEN" | "CLOSED" | "PARTIAL";
    source?: "BINANCE" | "BYBIT" | "BITGET" | "MANUAL";
    symbol?: string;
  } = {
    traderProfileId,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.source) {
    where.source = filters.source;
  }

  if (filters?.symbol) {
    where.symbol = filters.symbol.toUpperCase();
  }

  const orderBy = filters?.orderBy ?? "openedAt";
  const orderDir = filters?.orderDir ?? "desc";

  const trades = await prisma.traderTrade.findMany({
    where,
    orderBy: {
      [orderBy]: orderDir,
    },
    take: filters?.limit ?? 100,
  });

  logger.debug("Fetched trader trades", {
    traderProfileId,
    filters,
    count: trades.length,
  });

  return trades.map(serializeTraderTrade);
}

/**
 * Get a single trade with all relations
 */
export async function getTraderTradeWithRelations(tradeId: string) {
  const trade = await prisma.traderTrade.findUnique({
    where: { id: tradeId },
    include: {
      signals: true,
      copies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      fills: {
        select: {
          id: true,
          symbol: true,
          side: true,
          quantity: true,
          price: true,
          fee: true,
          executedAt: true,
        },
        orderBy: {
          executedAt: "asc",
        },
      },
    },
  });

  if (trade) {
    logger.debug("Fetched trade with relations", {
      tradeId,
      fillCount: trade.fills.length,
      signalCount: trade.signals.length,
      copyCount: trade.copies.length,
    });
  }

  return trade;
}

/**
 * Get open trades for a trader
 */
export async function getOpenTraderTrades(
  traderProfileId: string,
  symbol?: string,
): Promise<TraderTrade[]> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      status: { in: ["OPEN", "PARTIAL"] },
      ...(symbol && { symbol: symbol.toUpperCase() }),
    },
    orderBy: {
      lastActivityAt: "desc",
    },
  });

  logger.debug("Fetched open trades", {
    traderProfileId,
    symbol,
    count: trades.length,
  });

  return trades;
}

/**
 * Get trade performance statistics
 */
export async function getTradePerformanceStats(
  traderProfileId: string,
): Promise<{
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalRealizedPnl: number;
  totalFees: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
}> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
    },
  });

  const totalTrades = trades.length;
  const openTrades = trades.filter((t) => t.status === "OPEN").length;
  const closedTrades = trades.filter((t) => t.status === "CLOSED").length;

  let winningTrades = 0;
  let losingTrades = 0;
  let totalRealizedPnl = 0;
  let totalFees = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let bestTrade: { symbol: string; pnl: number } | null = null;
  let worstTrade: { symbol: string; pnl: number } | null = null;

  for (const trade of trades) {
    totalFees += Number(trade.fees);

    if (trade.realizedPnl !== null) {
      const pnl = Number(trade.realizedPnl);
      totalRealizedPnl += pnl;

      if (pnl > 0) {
        winningTrades++;
        totalWins += pnl;
        if (!bestTrade || pnl > bestTrade.pnl) {
          bestTrade = { symbol: trade.symbol, pnl };
        }
      } else if (pnl < 0) {
        losingTrades++;
        totalLosses += Math.abs(pnl);
        if (!worstTrade || pnl < worstTrade.pnl) {
          worstTrade = { symbol: trade.symbol, pnl };
        }
      }
    }
  }

  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
  const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;
  const profitFactor =
    totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  const stats = {
    totalTrades,
    openTrades,
    closedTrades,
    winningTrades,
    losingTrades,
    totalRealizedPnl,
    totalFees,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    bestTrade,
    worstTrade,
  };

  logger.info("Calculated trade performance stats", {
    traderProfileId,
    stats,
  });

  return stats;
}

/**
 * Get trades linked to signals
 */
export async function getTradesWithSignals(
  traderProfileId: string,
): Promise<(TraderTrade & { signals: Signal[] })[]> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      signals: {
        some: {},
      },
    },
    include: {
      signals: true,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  logger.debug("Fetched trades with signals", {
    traderProfileId,
    count: trades.length,
    totalSignals: trades.reduce((sum, t) => sum + t.signals.length, 0),
  });

  return trades;
}

/**
 * Get trades by instrument type
 */
export async function getTradesByInstrument(
  traderProfileId: string,
  instrumentType: "SPOT" | "FUTURES",
): Promise<TraderTrade[]> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      instrumentType,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  logger.debug("Fetched trades by instrument", {
    traderProfileId,
    instrumentType,
    count: trades.length,
  });

  return trades;
}

/**
 * Get recent trades for a trader
 */
export async function getRecentTraderTrades(
  traderProfileId: string,
  daysBack = 7,
  limit = 50,
): Promise<TraderTrade[]> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      openedAt: {
        gte: since,
      },
    },
    orderBy: {
      openedAt: "desc",
    },
    take: limit,
  });

  logger.debug("Fetched recent trades", {
    traderProfileId,
    daysBack,
    since: since.toISOString(),
    count: trades.length,
  });

  return trades;
}

/**
 * Check if a trade exists
 */
export async function checkTradeExists(
  tradeId: string,
  traderProfileId?: string,
): Promise<boolean> {
  const trade = await prisma.traderTrade.findFirst({
    where: {
      id: tradeId,
      ...(traderProfileId && { traderProfileId }),
    },
    select: { id: true },
  });

  return !!trade;
}

/**
 * Get trades with copies
 */
export async function getTradesWithCopies(
  traderProfileId: string,
): Promise<(TraderTrade & { copies: CopyTrade[] })[]> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      copies: {
        some: {},
      },
    },
    include: {
      copies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  logger.debug("Fetched trades with copies", {
    traderProfileId,
    count: trades.length,
    totalCopies: trades.reduce((sum, t) => sum + t.copies.length, 0),
  });

  return trades;
}

/**
 * Get trade count by status
 */
export async function getTradeCountByStatus(
  traderProfileId: string,
): Promise<Record<string, number>> {
  const counts = await prisma.traderTrade.groupBy({
    by: ["status"],
    where: {
      traderProfileId,
    },
    _count: {
      status: true,
    },
  });

  const result: Record<string, number> = {};
  for (const item of counts) {
    result[item.status] = item._count.status;
  }

  logger.debug("Trade count by status", {
    traderProfileId,
    counts: result,
  });

  return result;
}

/**
 * Get trade volume statistics
 */
export async function getTradeVolumeStats(traderProfileId: string): Promise<{
  totalVolume: number;
  avgTradeSize: number;
  largestTrade: { symbol: string; volume: number } | null;
  tradingPairs: string[];
}> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
    },
  });

  let totalVolume = 0;
  let largestTrade: { symbol: string; volume: number } | null = null;
  const tradingPairs = new Set<string>();

  for (const trade of trades) {
    const volume = Number(trade.totalQuantity) * Number(trade.averageEntry);
    totalVolume += volume;
    tradingPairs.add(trade.symbol);

    if (!largestTrade || volume > largestTrade.volume) {
      largestTrade = { symbol: trade.symbol, volume };
    }
  }

  const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;

  const stats = {
    totalVolume,
    avgTradeSize,
    largestTrade,
    tradingPairs: Array.from(tradingPairs),
  };

  logger.debug("Trade volume stats", {
    traderProfileId,
    stats,
  });

  return stats;
}
