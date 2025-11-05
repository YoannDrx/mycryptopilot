/**
 * Trader Trade Queries
 *
 * Database queries for TraderTrade (aggregated trades from exchanges + manual trades).
 * Used by trader dashboard to display unified trading history.
 */

import { prisma } from "@/lib/prisma";
import type { TraderTrade, TradeStatus, TradeSource } from "@/generated/prisma";

export type TraderTradeWithFills = TraderTrade & {
  fills: {
    id: string;
    externalOrderId: string;
    executedAt: Date;
  }[];
};

export type GetTraderTradesFilters = {
  /** Filter by trade status */
  status?: TradeStatus | TradeStatus[];

  /** Filter by source */
  source?: TradeSource | TradeSource[];

  /** Filter by symbol */
  symbol?: string;

  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
};

/**
 * Get trader trades with optional filters
 *
 * @param traderProfileId - Trader profile ID
 * @param filters - Optional filters
 * @returns Array of trades
 */
export async function getTraderTrades(
  traderProfileId: string,
  filters: GetTraderTradesFilters = {},
): Promise<TraderTradeWithFills[]> {
  const { status, source, symbol, limit = 50, offset = 0 } = filters;

  const where: {
    traderProfileId: string;
    status?: TradeStatus | { in: TradeStatus[] };
    source?: TradeSource | { in: TradeSource[] };
    symbol?: string;
  } = {
    traderProfileId,
  };

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  if (source) {
    where.source = Array.isArray(source) ? { in: source } : source;
  }

  if (symbol) {
    where.symbol = symbol;
  }

  return prisma.traderTrade.findMany({
    where,
    include: {
      fills: {
        select: {
          id: true,
          externalOrderId: true,
          executedAt: true,
        },
        orderBy: {
          executedAt: "desc",
        },
        take: 5, // Only show last 5 fills per trade
      },
    },
    orderBy: {
      lastActivityAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Get single trader trade by ID
 *
 * @param tradeId - Trade ID
 * @param traderProfileId - Trader profile ID (for authorization)
 * @returns Trade or null
 */
export async function getTraderTradeById(
  tradeId: string,
  traderProfileId: string,
): Promise<TraderTradeWithFills | null> {
  return prisma.traderTrade.findFirst({
    where: {
      id: tradeId,
      traderProfileId,
    },
    include: {
      fills: {
        select: {
          id: true,
          externalOrderId: true,
          executedAt: true,
        },
        orderBy: {
          executedAt: "desc",
        },
      },
    },
  });
}

/**
 * Count total trades for trader
 *
 * @param traderProfileId - Trader profile ID
 * @param filters - Optional filters
 * @returns Count
 */
export async function countTraderTrades(
  traderProfileId: string,
  filters: Omit<GetTraderTradesFilters, "limit" | "offset"> = {},
): Promise<number> {
  const { status, source, symbol } = filters;

  const where: {
    traderProfileId: string;
    status?: TradeStatus | { in: TradeStatus[] };
    source?: TradeSource | { in: TradeSource[] };
    symbol?: string;
  } = {
    traderProfileId,
  };

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  if (source) {
    where.source = Array.isArray(source) ? { in: source } : source;
  }

  if (symbol) {
    where.symbol = symbol;
  }

  return prisma.traderTrade.count({ where });
}

/**
 * Get open trades for trader
 *
 * @param traderProfileId - Trader profile ID
 * @returns Array of open/partial trades
 */
export async function getOpenTrades(
  traderProfileId: string,
): Promise<TraderTradeWithFills[]> {
  return getTraderTrades(traderProfileId, {
    status: ["OPEN", "PARTIAL"],
  });
}

/**
 * Get closed trades for trader
 *
 * @param traderProfileId - Trader profile ID
 * @param limit - Limit number of results
 * @returns Array of closed trades
 */
export async function getClosedTrades(
  traderProfileId: string,
  limit = 50,
): Promise<TraderTradeWithFills[]> {
  return getTraderTrades(traderProfileId, {
    status: "CLOSED",
    limit,
  });
}

/**
 * Get trades by symbol
 *
 * @param traderProfileId - Trader profile ID
 * @param symbol - Symbol (e.g., "BTC/USDT")
 * @returns Array of trades for symbol
 */
export async function getTradesBySymbol(
  traderProfileId: string,
  symbol: string,
): Promise<TraderTradeWithFills[]> {
  return getTraderTrades(traderProfileId, {
    symbol,
  });
}

/**
 * Get unique symbols traded by trader
 *
 * @param traderProfileId - Trader profile ID
 * @returns Array of unique symbols
 */
export async function getTradedSymbols(
  traderProfileId: string,
): Promise<string[]> {
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
    },
    select: {
      symbol: true,
    },
    distinct: ["symbol"],
    orderBy: {
      symbol: "asc",
    },
  });

  return trades.map((t) => t.symbol);
}
