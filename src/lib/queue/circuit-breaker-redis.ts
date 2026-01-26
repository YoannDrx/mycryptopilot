/**
 * Circuit Breaker Redis Service
 *
 * Atomic circuit breaker operations using Redis.
 * Solves race condition in check-then-increment pattern.
 *
 * Architecture:
 * - Redis: Real-time atomic counters (trades, loss) with TTL
 * - Prisma: Configuration (limits) + persistent state (isTripped)
 *
 * Why Redis?
 * - Atomic operations (INCR, INCRBY) prevent race conditions
 * - In-memory performance (< 1ms vs ~10ms for DB)
 * - Automatic TTL expiry (daily reset at midnight UTC)
 * - Cross-process consistency (multiple workers)
 *
 * Race Condition Fixed:
 * BEFORE (non-atomic):
 *   Thread A: READ count = 19, limit = 20 → OK
 *   Thread B: READ count = 19, limit = 20 → OK (race!)
 *   Thread A: WRITE count = 20
 *   Thread B: WRITE count = 21 (overflow!)
 *
 * AFTER (atomic):
 *   Thread A: INCR → returns 20 (limit = 20) → OK
 *   Thread B: INCR → returns 21 (limit = 20) → FAIL + DECR rollback
 *
 * @example
 * // Check and increment atomically
 * await checkAndIncrementTrades(userId, maxTrades);
 * // If this succeeds, trade is allowed and counter is incremented
 */

import { getRedisClient } from "@/lib/cache/redis-client";
import { logger } from "@/lib/logger";
import { CircuitBreakerTrippedError } from "./circuit-breaker.service";

// Redis key patterns
const TRADES_KEY = (userId: string) => `circuit-breaker:${userId}:trades`;
const LOSS_KEY = (userId: string) => `circuit-breaker:${userId}:loss`;

/**
 * Get seconds until midnight UTC (for Redis TTL)
 *
 * @returns Seconds remaining until midnight UTC
 */
function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * Atomically check and increment trade counter
 *
 * Uses Redis INCR for atomic increment-then-check pattern.
 * If limit exceeded, decrements back (rollback) and throws error.
 *
 * @param userId - User ID
 * @param maxDailyTrades - Maximum trades allowed per day
 * @throws CircuitBreakerTrippedError if limit exceeded
 *
 * @example
 * await checkAndIncrementTrades(userId, 20);
 * // Counter incremented atomically, trade is allowed
 */
export async function checkAndIncrementTrades(
  userId: string,
  maxDailyTrades: number,
): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    logger.warn(
      "Redis not available, circuit breaker check skipped (graceful degradation)",
      { userId },
    );
    return;
  }

  try {
    const key = TRADES_KEY(userId);

    // Atomic increment
    const newCount = await redis.incr(key);

    logger.debug("Trade counter incremented (atomic)", {
      userId,
      newCount,
      maxDailyTrades,
    });

    // Set expiry if first increment of the day
    if (newCount === 1) {
      const ttl = getSecondsUntilMidnightUTC();
      await redis.expire(key, ttl);
      logger.debug("Trade counter TTL set", { userId, ttlSeconds: ttl });
    }

    // Check if limit exceeded
    if (newCount > maxDailyTrades) {
      // Rollback the increment
      await redis.decr(key);

      logger.warn("Circuit breaker tripped (max trades)", {
        userId,
        newCount,
        maxDailyTrades,
      });

      throw new CircuitBreakerTrippedError(
        `Max daily trades exceeded (${maxDailyTrades})`,
        "max_trades",
        userId,
      );
    }

    logger.debug("Circuit breaker check passed (trades)", {
      userId,
      count: newCount,
      limit: maxDailyTrades,
    });
  } catch (error) {
    // Re-throw CircuitBreakerTrippedError as-is
    if (error instanceof CircuitBreakerTrippedError) {
      throw error;
    }

    // Log Redis errors but don't block trading (graceful degradation)
    logger.error("Redis circuit breaker check failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Graceful degradation: allow trade if Redis fails
    // TODO: Consider fallback to Prisma counter or fail-safe mode
  }
}

/**
 * Atomically increment loss counter and check limit
 *
 * Uses Redis INCRBYFLOAT for atomic increment of USD loss amount.
 * If limit exceeded, triggers circuit breaker trip.
 *
 * @param userId - User ID
 * @param lossUsd - Loss amount in USD
 * @param maxLossAmount - Maximum loss allowed per day (USD)
 * @throws CircuitBreakerTrippedError if limit exceeded
 *
 * @example
 * await incrementLoss(userId, 50.25, 1000);
 * // Loss counter incremented atomically
 */
export async function incrementLoss(
  userId: string,
  lossUsd: number,
  maxLossAmount: number | null,
): Promise<void> {
  const redis = getRedisClient();

  if (!redis || !maxLossAmount) {
    return; // No limit set or Redis unavailable
  }

  try {
    const key = LOSS_KEY(userId);

    // Atomic increment by float value
    // Note: Redis INCRBYFLOAT returns string representation
    const newLossStr = await redis.incrbyfloat(key, lossUsd);
    const newLoss = parseFloat(newLossStr);

    logger.debug("Loss counter incremented (atomic)", {
      userId,
      lossUsd,
      newLoss,
      maxLossAmount,
    });

    // Set expiry if first loss of the day
    if (newLoss === lossUsd) {
      const ttl = getSecondsUntilMidnightUTC();
      await redis.expire(key, ttl);
      logger.debug("Loss counter TTL set", { userId, ttlSeconds: ttl });
    }

    // Check if limit exceeded
    if (newLoss >= maxLossAmount) {
      logger.warn("Circuit breaker tripped (max loss)", {
        userId,
        newLoss,
        maxLossAmount,
      });

      throw new CircuitBreakerTrippedError(
        `Max daily loss exceeded ($${maxLossAmount})`,
        "max_loss",
        userId,
      );
    }

    logger.debug("Loss check passed", {
      userId,
      loss: newLoss,
      limit: maxLossAmount,
    });
  } catch (error) {
    if (error instanceof CircuitBreakerTrippedError) {
      throw error;
    }

    logger.error("Redis loss tracking failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get current counters from Redis
 *
 * @param userId - User ID
 * @returns Current trade count and loss amount
 */
export async function getCounters(userId: string): Promise<{
  trades: number;
  loss: number;
}> {
  const redis = getRedisClient();

  if (!redis) {
    return { trades: 0, loss: 0 };
  }

  try {
    const tradesKey = TRADES_KEY(userId);
    const lossKey = LOSS_KEY(userId);

    const [tradesStr, lossStr] = await Promise.all([
      redis.get(tradesKey),
      redis.get(lossKey),
    ]);

    const trades = tradesStr ? parseInt(tradesStr, 10) : 0;
    const loss = lossStr ? parseFloat(lossStr) : 0;

    return { trades, loss };
  } catch (error) {
    logger.error("Failed to get counters from Redis", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { trades: 0, loss: 0 };
  }
}

/**
 * Manually reset counters for a user
 *
 * Used for admin operations or testing.
 * Normally counters auto-expire at midnight UTC.
 *
 * @param userId - User ID
 */
export async function resetCounters(userId: string): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    logger.warn("Redis not available, cannot reset counters", { userId });
    return;
  }

  try {
    const tradesKey = TRADES_KEY(userId);
    const lossKey = LOSS_KEY(userId);

    await Promise.all([redis.del(tradesKey), redis.del(lossKey)]);

    logger.info("Circuit breaker counters reset", { userId });
  } catch (error) {
    logger.error("Failed to reset counters", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Test Redis atomic operations
 *
 * Useful for health checks and debugging.
 *
 * @returns True if Redis atomic operations work
 */
export async function testAtomicOperations(): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    return false;
  }

  try {
    const testKey = "circuit-breaker:test:atomic";

    // Test INCR
    const count1 = await redis.incr(testKey);
    const count2 = await redis.incr(testKey);

    // Test DECR
    const count3 = await redis.decr(testKey);

    // Test INCRBYFLOAT
    const float1 = await redis.incrbyfloat(`${testKey  }:float`, 1.5);
    const float2 = await redis.incrbyfloat(`${testKey  }:float`, 2.5);

    // Cleanup
    await redis.del(testKey, `${testKey  }:float`);

    const isValid =
      count1 === 1 &&
      count2 === 2 &&
      count3 === 1 &&
      float1 === "1.5" &&
      float2 === "4";

    logger.info("Redis atomic operations test", { isValid });

    return isValid;
  } catch (error) {
    logger.error("Redis atomic operations test failed", { error });
    return false;
  }
}
