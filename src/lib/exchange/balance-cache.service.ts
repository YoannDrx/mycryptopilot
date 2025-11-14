/**
 * Balance Cache Service
 *
 * Redis-based cache for exchange balance fetching to reduce API calls.
 *
 * Performance target:
 * - Reduce balance fetch from 2000ms (API call) to 50ms (cache hit)
 * - Reduce API calls from 250/hour to 8/hour (97% reduction)
 *
 * Features:
 * - Redis persistence (not in-memory)
 * - 30 second TTL (optimized for copy-trading)
 * - Cache key: balance:cache:{userId}:{exchange}
 * - Graceful degradation if Redis unavailable
 * - Cache invalidation on trade execution
 *
 * @example
 * const cached = await getCachedBalance(userId, exchange);
 * if (cached) {
 *   return cached; // 50ms
 * }
 * const balance = await exchangeService.fetchConsolidatedBalance(); // 2000ms
 * await setCachedBalance(userId, exchange, balance);
 */

import { getRedisClient } from "@/lib/cache/redis-client";
import { logger } from "@/lib/logger";
import type { ConsolidatedBalance } from "./types";
import type { Exchange } from "@/generated/prisma";

const CACHE_TTL_SECONDS = 30; // 30 seconds for copy-trading optimization
const CACHE_KEY_PREFIX = "balance:cache";

/**
 * Generate cache key for balance
 */
function getCacheKey(userId: string, exchange: Exchange): string {
  return `${CACHE_KEY_PREFIX}:${userId}:${exchange}`;
}

/**
 * Get cached balance for user + exchange
 * Returns null if not found, expired, or Redis unavailable
 */
export async function getCachedBalance(
  userId: string,
  exchange: Exchange,
): Promise<ConsolidatedBalance | null> {
  const redis = getRedisClient();

  // Graceful degradation if Redis unavailable
  if (!redis) {
    logger.debug("Redis unavailable, skipping balance cache get", {
      userId,
      exchange,
    });
    return null;
  }

  try {
    const cacheKey = getCacheKey(userId, exchange);
    const cached = await redis.get(cacheKey);

    if (!cached) {
      logger.debug("Balance cache miss", { userId, exchange });
      return null;
    }

    // Parse cached balance and restore Date object
    const parsed = JSON.parse(cached);
    const balance: ConsolidatedBalance = {
      ...parsed,
      timestamp: new Date(parsed.timestamp),
    };

    logger.debug("Balance cache hit", {
      userId,
      exchange,
      totalEquityUsd: balance.totalEquityUsd,
    });

    return balance;
  } catch (error) {
    logger.error("Failed to get cached balance", {
      userId,
      exchange,
      error: error instanceof Error ? error.message : String(error),
    });
    return null; // Fail gracefully
  }
}

/**
 * Set cached balance for user + exchange
 * TTL: 30 seconds
 */
export async function setCachedBalance(
  userId: string,
  exchange: Exchange,
  balance: ConsolidatedBalance,
): Promise<void> {
  const redis = getRedisClient();

  // Graceful degradation if Redis unavailable
  if (!redis) {
    logger.debug("Redis unavailable, skipping balance cache set", {
      userId,
      exchange,
    });
    return;
  }

  try {
    const cacheKey = getCacheKey(userId, exchange);
    const serialized = JSON.stringify(balance);

    await redis.setex(cacheKey, CACHE_TTL_SECONDS, serialized);

    logger.debug("Balance cached", {
      userId,
      exchange,
      totalEquityUsd: balance.totalEquityUsd,
      ttl: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    logger.error("Failed to set cached balance", {
      userId,
      exchange,
      error: error instanceof Error ? error.message : String(error),
    });
    // Fail gracefully - don't throw
  }
}

/**
 * Invalidate cached balance for user + exchange
 * Call this after trade execution to force fresh balance fetch
 */
export async function invalidateCachedBalance(
  userId: string,
  exchange: Exchange,
): Promise<void> {
  const redis = getRedisClient();

  // Graceful degradation if Redis unavailable
  if (!redis) {
    logger.debug("Redis unavailable, skipping balance cache invalidation", {
      userId,
      exchange,
    });
    return;
  }

  try {
    const cacheKey = getCacheKey(userId, exchange);
    await redis.del(cacheKey);

    logger.debug("Balance cache invalidated", {
      userId,
      exchange,
    });
  } catch (error) {
    logger.error("Failed to invalidate cached balance", {
      userId,
      exchange,
      error: error instanceof Error ? error.message : String(error),
    });
    // Fail gracefully - don't throw
  }
}

/**
 * Get cache stats for monitoring
 */
export async function getBalanceCacheStats(): Promise<{
  totalKeys: number;
  keysSample: string[];
} | null> {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    // Scan for all balance cache keys using recursive scan
    const scanKeys = async (
      cursor: string,
      accumulator: string[],
    ): Promise<string[]> => {
      const [nextCursor, batch] = await redis.scan(
        cursor,
        "MATCH",
        `${CACHE_KEY_PREFIX}:*`,
        "COUNT",
        100,
      );

      const newAccumulator = [...accumulator, ...batch];

      if (nextCursor === "0") {
        return newAccumulator;
      }

      return scanKeys(nextCursor, newAccumulator);
    };

    const keys = await scanKeys("0", []);

    return {
      totalKeys: keys.length,
      keysSample: keys.slice(0, 10), // First 10 keys
    };
  } catch (error) {
    logger.error("Failed to get balance cache stats", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
