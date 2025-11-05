/**
 * Unrealized PnL Service
 *
 * Calculates unrealized PnL for open positions with Redis caching.
 * Supports both real-time price fetching and cached calculations.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getCachedPnL,
  setCachedPnL,
  getCachedPrice,
  setCachedPrice,
  getCachedPnLs,
  type CachedPnL,
} from "@/lib/cache/pnl-cache.service";
import type { TraderTrade } from "@/generated/prisma";

/**
 * Types
 */
export type UnrealizedPnLResult = {
  tradeId: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  fromCache: boolean;
};

export type PriceFetcher = (symbol: string) => Promise<number>;

/**
 * Calculate unrealized PnL for a single trade
 */
export async function calculateUnrealizedPnL(
  trade: TraderTrade,
  priceFetcher: PriceFetcher,
  useCache = true,
): Promise<UnrealizedPnLResult> {
  // Check if trade is open
  if (trade.status !== "OPEN") {
    throw new Error("Cannot calculate unrealized PnL for closed trade");
  }

  // Try to get from cache first
  if (useCache) {
    const cachedPnL = await getCachedPnL(trade.id);
    if (cachedPnL) {
      logger.debug("Using cached PnL", { tradeId: trade.id });
      return {
        tradeId: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: Number(trade.totalQuantity),
        entryPrice: Number(trade.averageEntry),
        currentPrice: cachedPnL.currentPrice,
        unrealizedPnl: cachedPnL.unrealizedPnl,
        unrealizedPnlPercent: cachedPnL.unrealizedPnlPercent,
        fromCache: true,
      };
    }
  }

  // Get current market price
  let currentPrice: number;

  // Try cache first
  const cachedPrice = await getCachedPrice(trade.symbol);
  if (cachedPrice) {
    currentPrice = cachedPrice;
    logger.debug("Using cached price", {
      symbol: trade.symbol,
      price: cachedPrice,
    });
  } else {
    // Fetch fresh price
    currentPrice = await priceFetcher(trade.symbol);
    // Cache the price
    await setCachedPrice(trade.symbol, currentPrice);
    logger.debug("Fetched and cached price", {
      symbol: trade.symbol,
      price: currentPrice,
    });
  }

  // Calculate PnL based on side
  const quantity = Number(trade.totalQuantity);
  const entryPrice = Number(trade.averageEntry);
  let unrealizedPnl: number;
  let unrealizedPnlPercent: number;

  if (trade.side === "BUY") {
    // Long position: profit when price goes up
    unrealizedPnl = (currentPrice - entryPrice) * quantity;
    unrealizedPnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  } else {
    // Short position: profit when price goes down
    unrealizedPnl = (entryPrice - currentPrice) * quantity;
    unrealizedPnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
  }

  // Subtract fees from unrealized PnL
  const fees = Number(trade.fees);
  unrealizedPnl -= fees;

  const result: UnrealizedPnLResult = {
    tradeId: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    quantity,
    entryPrice,
    currentPrice,
    unrealizedPnl,
    unrealizedPnlPercent,
    fromCache: false,
  };

  // Cache the result
  if (useCache) {
    const cachedData: CachedPnL = {
      tradeId: trade.id,
      unrealizedPnl,
      unrealizedPnlPercent,
      currentPrice,
      timestamp: Date.now(),
    };
    await setCachedPnL(cachedData);
  }

  return result;
}

/**
 * Calculate unrealized PnL for multiple trades (batch)
 */
export async function calculateUnrealizedPnLBatch(
  trades: TraderTrade[],
  priceFetcher: PriceFetcher,
  useCache = true,
): Promise<UnrealizedPnLResult[]> {
  // Filter only open trades
  const openTrades = trades.filter((t) => t.status === "OPEN");

  if (openTrades.length === 0) {
    return [];
  }

  // Try to get cached PnLs first
  const results: UnrealizedPnLResult[] = [];
  const tradesNeedingCalculation: TraderTrade[] = [];

  if (useCache) {
    const tradeIds = openTrades.map((t) => t.id);
    const cachedPnLs = await getCachedPnLs(tradeIds);

    openTrades.forEach((trade) => {
      const cached = cachedPnLs.get(trade.id);
      if (cached) {
        results.push({
          tradeId: trade.id,
          symbol: trade.symbol,
          side: trade.side,
          quantity: Number(trade.totalQuantity),
          entryPrice: Number(trade.averageEntry),
          currentPrice: cached.currentPrice,
          unrealizedPnl: cached.unrealizedPnl,
          unrealizedPnlPercent: cached.unrealizedPnlPercent,
          fromCache: true,
        });
      } else {
        tradesNeedingCalculation.push(trade);
      }
    });

    logger.debug("Batch PnL calculation", {
      total: openTrades.length,
      fromCache: results.length,
      needCalculation: tradesNeedingCalculation.length,
    });
  } else {
    tradesNeedingCalculation.push(...openTrades);
  }

  // Calculate PnL for trades not in cache
  if (tradesNeedingCalculation.length > 0) {
    const freshResults = await Promise.all(
      tradesNeedingCalculation.map(async (trade) =>
        calculateUnrealizedPnL(trade, priceFetcher, useCache),
      ),
    );
    results.push(...freshResults);
  }

  return results;
}

/**
 * Get total unrealized PnL for a trader profile
 */
export async function getTotalUnrealizedPnL(
  traderProfileId: string,
  priceFetcher: PriceFetcher,
  useCache = true,
): Promise<{
  totalUnrealizedPnl: number;
  openPositionsCount: number;
  positivePnlCount: number;
  negativePnlCount: number;
  positions: UnrealizedPnLResult[];
}> {
  // Get all open trades
  const openTrades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      status: "OPEN",
    },
  });

  if (openTrades.length === 0) {
    return {
      totalUnrealizedPnl: 0,
      openPositionsCount: 0,
      positivePnlCount: 0,
      negativePnlCount: 0,
      positions: [],
    };
  }

  // Calculate PnL for all positions
  const positions = await calculateUnrealizedPnLBatch(
    openTrades,
    priceFetcher,
    useCache,
  );

  // Aggregate results
  const totalUnrealizedPnl = positions.reduce(
    (sum, pos) => sum + pos.unrealizedPnl,
    0,
  );
  const positivePnlCount = positions.filter((p) => p.unrealizedPnl > 0).length;
  const negativePnlCount = positions.filter((p) => p.unrealizedPnl < 0).length;

  return {
    totalUnrealizedPnl,
    openPositionsCount: positions.length,
    positivePnlCount,
    negativePnlCount,
    positions,
  };
}

/**
 * Calculate and cache unrealized PnL for a trade
 * Note: PnL is cached in Redis only, not stored in database
 */
export async function updateTradeUnrealizedPnL(
  tradeId: string,
  priceFetcher: PriceFetcher,
  useCache = true,
): Promise<UnrealizedPnLResult> {
  const trade = await prisma.traderTrade.findUnique({
    where: { id: tradeId },
  });

  if (!trade) {
    throw new Error(`Trade ${tradeId} not found`);
  }

  if (trade.status !== "OPEN") {
    throw new Error("Cannot calculate unrealized PnL for closed trade");
  }

  const pnl = await calculateUnrealizedPnL(trade, priceFetcher, useCache);

  logger.info("Calculated and cached unrealized PnL", {
    tradeId,
    unrealizedPnl: pnl.unrealizedPnl,
    fromCache: pnl.fromCache,
  });

  return pnl;
}

/**
 * Refresh all unrealized PnL values for a trader
 * Note: PnL is cached in Redis only, not stored in database
 */
export async function refreshAllUnrealizedPnL(
  traderProfileId: string,
  priceFetcher: PriceFetcher,
  useCache = true,
): Promise<UnrealizedPnLResult[]> {
  const openTrades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      status: "OPEN",
    },
  });

  if (openTrades.length === 0) {
    return [];
  }

  const pnlResults = await calculateUnrealizedPnLBatch(
    openTrades,
    priceFetcher,
    useCache,
  );

  logger.info("Refreshed all unrealized PnL", {
    traderProfileId,
    count: pnlResults.length,
    totalPnl: pnlResults.reduce((sum, p) => sum + p.unrealizedPnl, 0),
  });

  return pnlResults;
}
