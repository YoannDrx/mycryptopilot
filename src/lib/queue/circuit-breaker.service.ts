/**
 * Circuit Breaker Service
 *
 * Automatic risk management for copy-trading.
 * Prevents excessive losses and trades per user.
 * Resets daily at midnight UTC.
 *
 * ARCHITECTURE (Phase 2.1 - Atomic Operations):
 * - Redis: Real-time atomic counters (trades, loss) with TTL
 * - Prisma: Configuration (limits) + persistent state (isTripped)
 *
 * This hybrid approach ensures:
 * - Atomic operations prevent race conditions (Redis)
 * - Configuration persistence across restarts (Prisma)
 * - Graceful degradation if Redis unavailable
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  checkAndIncrementTrades as atomicCheckAndIncrementTrades,
  incrementLoss as atomicIncrementLoss,
  getCounters as getRedisCounters,
} from "./circuit-breaker-redis";

/**
 * Custom error for circuit breaker trips
 */
export class CircuitBreakerTrippedError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
    public readonly userId: string,
  ) {
    super(message);
    this.name = "CircuitBreakerTrippedError";
  }
}

/**
 * Check if circuit breaker is tripped for a user
 * Throws CircuitBreakerTrippedError if breaker is tripped
 *
 * Phase 2.1 - Atomic Operations:
 * - Uses Redis atomic INCR for trade counter (prevents race conditions)
 * - Checks Prisma for manual trip status and configuration
 * - Atomically increments counter BEFORE executing trade
 *
 * Old pattern (race condition):
 *   1. Check count < limit (READ)
 *   2. Execute trade
 *   3. Increment count (WRITE)
 *   ❌ Gap between steps 1-3 allows race condition
 *
 * New pattern (atomic):
 *   1. Atomic INCR + check (single operation)
 *   2. Execute trade (only if step 1 succeeded)
 *   ✅ No gap, no race condition
 */
export async function checkCircuitBreaker(userId: string): Promise<void> {
  // Get or create circuit breaker configuration
  let breaker = await prisma.circuitBreaker.findUnique({
    where: { userId },
  });

  if (!breaker) {
    // Create default circuit breaker
    breaker = await prisma.circuitBreaker.create({
      data: {
        userId,
        maxDailyTrades: 20,
        maxLossPercent: 5.0,
      },
    });
    logger.info("Circuit breaker created for user", { userId });
  }

  // Check if manually tripped
  if (breaker.isTripped) {
    throw new CircuitBreakerTrippedError(
      `Circuit breaker is tripped: ${breaker.tripReason}`,
      breaker.tripReason ?? "unknown",
      userId,
    );
  }

  // Atomically check and increment trade counter using Redis
  // This replaces the old check-then-increment pattern
  // Throws CircuitBreakerTrippedError if limit exceeded
  await atomicCheckAndIncrementTrades(userId, breaker.maxDailyTrades);

  // Note: Loss limit is checked separately when loss is recorded
  // (after trade completes and PnL is calculated)

  logger.debug("Circuit breaker check passed", {
    userId,
    maxTrades: breaker.maxDailyTrades,
  });
}

/**
 * Increment trade counter after successful execution
 * Called after a copy-trade is executed
 *
 * @deprecated Phase 2.1 - No longer needed with atomic operations
 *
 * With atomic pattern, counter is incremented in checkCircuitBreaker()
 * BEFORE executing the trade (not after). This prevents race conditions.
 *
 * This function is now a no-op for backwards compatibility.
 * It will be removed in a future version.
 */
export async function incrementTradeCounter(userId: string): Promise<void> {
  // No-op: Counter already incremented atomically in checkCircuitBreaker()
  logger.debug("incrementTradeCounter called (no-op with atomic pattern)", {
    userId,
  });
}

/**
 * Record loss for circuit breaker
 * Called after a losing trade
 *
 * Phase 2.1 - Atomic Operations:
 * - Uses Redis atomic INCRBYFLOAT for loss counter
 * - Trips circuit breaker if limit exceeded
 * - Updates Prisma for persistent trip status
 */
export async function recordLoss(
  userId: string,
  lossUsd: number,
): Promise<void> {
  // Get configuration
  const breaker = await prisma.circuitBreaker.findUnique({
    where: { userId },
  });

  if (!breaker) {
    logger.warn("Circuit breaker not found for user, skipping loss record", {
      userId,
    });
    return;
  }

  // Atomically increment loss counter in Redis
  try {
    await atomicIncrementLoss(
      userId,
      lossUsd,
      breaker.maxLossAmount?.toNumber() ?? null,
    );

    logger.warn("Loss recorded (atomic)", {
      userId,
      lossUsd,
      maxLossAmount: breaker.maxLossAmount?.toNumber(),
    });
  } catch (error) {
    if (error instanceof CircuitBreakerTrippedError) {
      // Trip circuit breaker in Prisma for persistence
      await prisma.circuitBreaker.update({
        where: { userId },
        data: {
          isTripped: true,
          tripReason: "max_loss",
          lastTrippedAt: new Date(),
        },
      });

      logger.warn("Circuit breaker tripped due to max loss", { userId });
      throw error; // Re-throw to notify caller
    }

    // Log but don't fail if Redis error (graceful degradation)
    logger.error("Failed to record loss in Redis", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Manually trip circuit breaker
 * Allows users to manually pause trading
 */
export async function manualTripCircuitBreaker(userId: string): Promise<void> {
  await prisma.circuitBreaker.update({
    where: { userId },
    data: {
      isTripped: true,
      tripReason: "manual",
      lastTrippedAt: new Date(),
    },
  });

  logger.info("Circuit breaker manually tripped by user", { userId });
}

/**
 * Manually reset circuit breaker
 * Allows users to manually resume trading
 */
export async function manualResetCircuitBreaker(userId: string): Promise<void> {
  await prisma.circuitBreaker.update({
    where: { userId },
    data: {
      isTripped: false,
      tripReason: null,
    },
  });

  logger.info("Circuit breaker manually reset by user", { userId });
}

/**
 * Get circuit breaker status for a user
 *
 * Phase 2.1 - Atomic Operations:
 * - Gets real-time counters from Redis (trades, loss)
 * - Gets configuration from Prisma (limits, trip status)
 */
export async function getCircuitBreakerStatus(userId: string) {
  let breaker = await prisma.circuitBreaker.findUnique({
    where: { userId },
  });

  // Create default if doesn't exist
  breaker ??= await prisma.circuitBreaker.create({
    data: {
      userId,
      maxDailyTrades: 20,
      maxLossPercent: 5.0,
    },
  });

  // Get real-time counters from Redis
  const counters = await getRedisCounters(userId);

  return {
    isTripped: breaker.isTripped,
    tripReason: breaker.tripReason,
    dailyTradesCount: counters.trades, // From Redis (real-time)
    maxDailyTrades: breaker.maxDailyTrades,
    dailyLossUsd: counters.loss, // From Redis (real-time)
    maxLossAmount: breaker.maxLossAmount?.toNumber() ?? null,
    lastResetAt: breaker.lastResetAt,
    lastTrippedAt: breaker.lastTrippedAt,
  };
}

/**
 * Update circuit breaker configuration
 */
export async function updateCircuitBreakerConfig(
  userId: string,
  config: {
    maxDailyTrades?: number;
    maxLossPercent?: number;
    maxLossAmount?: number | null;
  },
): Promise<void> {
  await prisma.circuitBreaker.update({
    where: { userId },
    data: config,
  });

  logger.info("Circuit breaker config updated", { userId, config });
}
