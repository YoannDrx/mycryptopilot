/**
 * Circuit Breaker Service
 *
 * Automatic risk management for copy-trading.
 * Prevents excessive losses and trades per user.
 * Resets daily at midnight UTC.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

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
 * This function is called before executing any copy-trade
 * Uses transaction to ensure atomic check + update
 */
export async function checkCircuitBreaker(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get or create circuit breaker for user
    let breaker = await tx.circuitBreaker.findUnique({
      where: { userId },
    });

    if (!breaker) {
      // Create default circuit breaker
      breaker = await tx.circuitBreaker.create({
        data: {
          userId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });
      logger.info("Circuit breaker created for user", { userId });
    }

    // Check if we need to reset daily counters
    const now = new Date();
    const lastReset = new Date(breaker.lastResetAt);
    const isNewDay =
      now.getUTCDate() !== lastReset.getUTCDate() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCFullYear() !== lastReset.getUTCFullYear();

    if (isNewDay) {
      // Reset daily counters
      breaker = await tx.circuitBreaker.update({
        where: { userId },
        data: {
          dailyTradesCount: 0,
          dailyLossUsd: 0,
          isTripped: false,
          tripReason: null,
          lastResetAt: now,
        },
      });
      logger.info("Circuit breaker reset for new day", { userId });
    }

    // Check if already tripped
    if (breaker.isTripped) {
      throw new CircuitBreakerTrippedError(
        `Circuit breaker is tripped: ${breaker.tripReason}`,
        breaker.tripReason ?? "unknown",
        userId,
      );
    }

    // Check daily trade limit
    if (breaker.dailyTradesCount >= breaker.maxDailyTrades) {
      await tx.circuitBreaker.update({
        where: { userId },
        data: {
          isTripped: true,
          tripReason: "max_trades",
          lastTrippedAt: new Date(),
        },
      });
      logger.warn("Circuit breaker tripped", { userId, reason: "max_trades" });
      throw new CircuitBreakerTrippedError(
        `Max daily trades exceeded (${breaker.maxDailyTrades})`,
        "max_trades",
        userId,
      );
    }

    // Check daily loss limit (if maxLossAmount is set)
    if (
      breaker.maxLossAmount &&
      breaker.dailyLossUsd.toNumber() >= breaker.maxLossAmount.toNumber()
    ) {
      await tx.circuitBreaker.update({
        where: { userId },
        data: {
          isTripped: true,
          tripReason: "max_loss",
          lastTrippedAt: new Date(),
        },
      });
      logger.warn("Circuit breaker tripped", { userId, reason: "max_loss" });
      throw new CircuitBreakerTrippedError(
        `Max daily loss exceeded ($${breaker.maxLossAmount})`,
        "max_loss",
        userId,
      );
    }

    logger.debug("Circuit breaker check passed", {
      userId,
      dailyTrades: breaker.dailyTradesCount,
      maxTrades: breaker.maxDailyTrades,
      dailyLoss: breaker.dailyLossUsd.toNumber(),
    });
  });
}

/**
 * Increment trade counter after successful execution
 * Called after a copy-trade is executed
 */
export async function incrementTradeCounter(userId: string): Promise<void> {
  await prisma.circuitBreaker.update({
    where: { userId },
    data: {
      dailyTradesCount: {
        increment: 1,
      },
    },
  });

  logger.info("Trade counter incremented", { userId });
}

/**
 * Record loss for circuit breaker
 * Called after a losing trade
 */
export async function recordLoss(
  userId: string,
  lossUsd: number,
): Promise<void> {
  const breaker = await prisma.circuitBreaker.update({
    where: { userId },
    data: {
      dailyLossUsd: {
        increment: lossUsd,
      },
    },
  });

  logger.warn("Loss recorded", {
    userId,
    lossUsd,
    totalDailyLoss: breaker.dailyLossUsd.toNumber(),
  });

  // Check if we've exceeded loss limit
  if (
    breaker.maxLossAmount &&
    breaker.dailyLossUsd.toNumber() >= breaker.maxLossAmount.toNumber()
  ) {
    await prisma.circuitBreaker.update({
      where: { userId },
      data: {
        isTripped: true,
        tripReason: "max_loss",
        lastTrippedAt: new Date(),
      },
    });
    logger.warn("Circuit breaker tripped due to max loss", { userId });
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

  return {
    isTripped: breaker.isTripped,
    tripReason: breaker.tripReason,
    dailyTradesCount: breaker.dailyTradesCount,
    maxDailyTrades: breaker.maxDailyTrades,
    dailyLossUsd: breaker.dailyLossUsd.toNumber(),
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
