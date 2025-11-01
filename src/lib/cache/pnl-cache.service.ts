/**
 * PnL Cache Service
 *
 * Redis-based caching for unrealized PnL calculations.
 * Stores market prices and position data to avoid redundant calculations.
 */

import { getRedisClient } from "./redis-client";
import { logger } from "@/lib/logger";

// Cache TTL (Time To Live) in seconds
const PRICE_CACHE_TTL = 60; // 1 minute for prices
const POSITION_CACHE_TTL = 300; // 5 minutes for positions
const PNL_CACHE_TTL = 30; // 30 seconds for calculated PnL

// Cache key prefixes
const PRICE_KEY_PREFIX = "price:";
const POSITION_KEY_PREFIX = "position:";
const PNL_KEY_PREFIX = "pnl:";

/**
 * Types
 */
export type CachedPrice = {
  symbol: string;
  price: number;
  timestamp: number;
};

export type CachedPosition = {
  tradeId: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  timestamp: number;
};

export type CachedPnL = {
  tradeId: string;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  currentPrice: number;
  timestamp: number;
};

/**
 * Get market price from cache
 */
export async function getCachedPrice(symbol: string): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = `${PRICE_KEY_PREFIX}${symbol}`;
    const cached = await redis.get(key);

    if (!cached) return null;

    const data: CachedPrice = JSON.parse(cached);
    return data.price;
  } catch (error) {
    logger.error("Failed to get cached price", { symbol, error });
    return null;
  }
}

/**
 * Set market price in cache
 */
export async function setCachedPrice(
  symbol: string,
  price: number,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `${PRICE_KEY_PREFIX}${symbol}`;
    const data: CachedPrice = {
      symbol,
      price,
      timestamp: Date.now(),
    };

    await redis.setex(key, PRICE_CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    logger.error("Failed to set cached price", { symbol, price, error });
  }
}

/**
 * Get multiple prices from cache
 */
export async function getCachedPrices(
  symbols: string[],
): Promise<Map<string, number>> {
  const redis = getRedisClient();
  const prices = new Map<string, number>();

  if (!redis) return prices;

  try {
    const keys = symbols.map((symbol) => `${PRICE_KEY_PREFIX}${symbol}`);
    const values = await redis.mget(...keys);

    values.forEach((value: string | null, index: number) => {
      if (value) {
        const data: CachedPrice = JSON.parse(value);
        prices.set(symbols[index] ?? "", data.price);
      }
    });

    return prices;
  } catch (error) {
    logger.error("Failed to get cached prices", { symbols, error });
    return prices;
  }
}

/**
 * Set multiple prices in cache
 */
export async function setCachedPrices(
  pricesMap: Map<string, number>,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const pipeline = redis.pipeline();

    pricesMap.forEach((price, symbol) => {
      const key = `${PRICE_KEY_PREFIX}${symbol}`;
      const data: CachedPrice = {
        symbol,
        price,
        timestamp: Date.now(),
      };
      pipeline.setex(key, PRICE_CACHE_TTL, JSON.stringify(data));
    });

    await pipeline.exec();
  } catch (error) {
    logger.error("Failed to set cached prices", { error });
  }
}

/**
 * Get position from cache
 */
export async function getCachedPosition(
  tradeId: string,
): Promise<CachedPosition | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = `${POSITION_KEY_PREFIX}${tradeId}`;
    const cached = await redis.get(key);

    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    logger.error("Failed to get cached position", { tradeId, error });
    return null;
  }
}

/**
 * Set position in cache
 */
export async function setCachedPosition(
  position: CachedPosition,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `${POSITION_KEY_PREFIX}${position.tradeId}`;
    const data = {
      ...position,
      timestamp: Date.now(),
    };

    await redis.setex(key, POSITION_CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    logger.error("Failed to set cached position", { position, error });
  }
}

/**
 * Get calculated PnL from cache
 */
export async function getCachedPnL(tradeId: string): Promise<CachedPnL | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = `${PNL_KEY_PREFIX}${tradeId}`;
    const cached = await redis.get(key);

    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    logger.error("Failed to get cached PnL", { tradeId, error });
    return null;
  }
}

/**
 * Set calculated PnL in cache
 */
export async function setCachedPnL(pnl: CachedPnL): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `${PNL_KEY_PREFIX}${pnl.tradeId}`;
    const data = {
      ...pnl,
      timestamp: Date.now(),
    };

    await redis.setex(key, PNL_CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    logger.error("Failed to set cached PnL", { pnl, error });
  }
}

/**
 * Get multiple PnLs from cache
 */
export async function getCachedPnLs(
  tradeIds: string[],
): Promise<Map<string, CachedPnL>> {
  const redis = getRedisClient();
  const pnls = new Map<string, CachedPnL>();

  if (!redis) return pnls;

  try {
    const keys = tradeIds.map((id) => `${PNL_KEY_PREFIX}${id}`);
    const values = await redis.mget(...keys);

    values.forEach((value: string | null, index: number) => {
      if (value) {
        const data: CachedPnL = JSON.parse(value);
        pnls.set(tradeIds[index] ?? "", data);
      }
    });

    return pnls;
  } catch (error) {
    logger.error("Failed to get cached PnLs", { tradeIds, error });
    return pnls;
  }
}

/**
 * Invalidate position cache
 */
export async function invalidatePositionCache(tradeId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const positionKey = `${POSITION_KEY_PREFIX}${tradeId}`;
    const pnlKey = `${PNL_KEY_PREFIX}${tradeId}`;

    await redis.del(positionKey, pnlKey);

    logger.debug("Invalidated position cache", { tradeId });
  } catch (error) {
    logger.error("Failed to invalidate position cache", { tradeId, error });
  }
}

/**
 * Invalidate price cache
 */
export async function invalidatePriceCache(symbol: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = `${PRICE_KEY_PREFIX}${symbol}`;
    await redis.del(key);

    logger.debug("Invalidated price cache", { symbol });
  } catch (error) {
    logger.error("Failed to invalidate price cache", { symbol, error });
  }
}

/**
 * Clear all PnL caches
 */
export async function clearAllPnLCaches(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Get all PnL keys
    const keys = await redis.keys(`${PNL_KEY_PREFIX}*`);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info("Cleared all PnL caches", { count: keys.length });
    }
  } catch (error) {
    logger.error("Failed to clear all PnL caches", { error });
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  priceCount: number;
  positionCount: number;
  pnlCount: number;
}> {
  const redis = getRedisClient();

  if (!redis) {
    return { priceCount: 0, positionCount: 0, pnlCount: 0 };
  }

  try {
    const [priceKeys, positionKeys, pnlKeys] = await Promise.all([
      redis.keys(`${PRICE_KEY_PREFIX}*`),
      redis.keys(`${POSITION_KEY_PREFIX}*`),
      redis.keys(`${PNL_KEY_PREFIX}*`),
    ]);

    return {
      priceCount: priceKeys.length,
      positionCount: positionKeys.length,
      pnlCount: pnlKeys.length,
    };
  } catch (error) {
    logger.error("Failed to get cache stats", { error });
    return { priceCount: 0, positionCount: 0, pnlCount: 0 };
  }
}
