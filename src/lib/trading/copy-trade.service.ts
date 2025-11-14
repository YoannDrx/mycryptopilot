/**
 * Copy Trade Service
 *
 * Manages copy trading functionality for users following traders.
 * Supports both MANUAL (journal tracking) and AUTO (exchange execution) modes.
 *
 * Features:
 * - Create copy trade entries when traders open positions
 * - Execute trades automatically via exchange API (AUTO mode)
 * - Track manual copies for journaling (MANUAL mode)
 * - Calculate copy sizing based on user's risk settings
 * - Monitor execution status and slippage
 *
 * @example
 * const copy = await createCopyTrade({
 *   userId,
 *   originalTradeId,
 *   mode: "AUTO",
 *   copyRatio: 0.5
 * });
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { recordLoss } from "@/lib/queue/circuit-breaker.service";
import type { CopyTrade, TraderTrade, User } from "@/generated/prisma";
import { invalidateCachedBalance } from "@/lib/exchange/balance-cache.service";

// ============= Types =============

export type CreateCopyTradeInput = {
  userId: string;
  originalTradeId: string;
  mode: "MANUAL" | "AUTO";
  copyRatio?: number; // Percentage of original trade size (0.01 to 1.0)
  maxAmount?: number; // Maximum USD amount to risk
  manualEntry?: number; // For MANUAL mode
};

export type ExecuteCopyTradeInput = {
  copyTradeId: string;
  exchangeOrderId: string;
  executedPrice: number;
  executedQuantity: number;
  slippage?: number;
};

export type CopyTradeWithRelations = {
  originalTrade: TraderTrade;
  user: User;
} & CopyTrade;

export type CopyTradeStats = {
  totalCopies: number;
  successfulCopies: number;
  failedCopies: number;
  pendingCopies: number;
  totalVolume: number;
  averageSlippage: number;
};

// ============= Validation =============

/**
 * Validate copy trade input
 */
function validateCopyTradeInput(input: CreateCopyTradeInput): void {
  if (input.copyRatio !== undefined) {
    if (input.copyRatio <= 0 || input.copyRatio > 1) {
      throw new Error("Copy ratio must be between 0.01 and 1.0");
    }
  }

  if (input.maxAmount !== undefined && input.maxAmount <= 0) {
    throw new Error("Max amount must be positive");
  }

  if (input.mode === "MANUAL" && !input.manualEntry) {
    throw new Error("Manual entry price is required for MANUAL mode");
  }
}

/**
 * Check if user can copy a trade
 */
async function validateUserCanCopy(
  userId: string,
  originalTradeId: string,
): Promise<void> {
  // Check if user already has a copy of this trade
  const existingCopy = await prisma.copyTrade.findFirst({
    where: {
      userId,
      originalTradeId,
      status: { in: ["PENDING", "EXECUTED"] },
    },
  });

  if (existingCopy) {
    throw new Error("You already have an active copy of this trade");
  }

  // Check if original trade exists and is open
  const originalTrade = await prisma.traderTrade.findUnique({
    where: { id: originalTradeId },
  });

  if (!originalTrade) {
    throw new Error("Original trade not found");
  }

  if (originalTrade.status !== "OPEN") {
    throw new Error("Can only copy open trades");
  }
}

// ============= Core Functions =============

/**
 * Create a copy trade entry
 */
export async function createCopyTrade(
  input: CreateCopyTradeInput,
): Promise<CopyTrade> {
  logger.info("Creating copy trade", {
    userId: input.userId,
    originalTradeId: input.originalTradeId,
    mode: input.mode,
  });

  // Validate input
  validateCopyTradeInput(input);
  await validateUserCanCopy(input.userId, input.originalTradeId);

  // Get original trade details
  const originalTrade = await prisma.traderTrade.findUnique({
    where: { id: input.originalTradeId },
    include: {
      trader: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!originalTrade) {
    throw new Error("Original trade not found");
  }

  // Calculate copy size based on user's settings
  const copyRatio = input.copyRatio ?? 1.0;
  const plannedQuantity = Number(originalTrade.totalQuantity) * copyRatio;

  // Apply max amount limit if specified
  let finalQuantity = plannedQuantity;
  if (input.maxAmount) {
    const tradeValue = plannedQuantity * Number(originalTrade.averageEntry);
    if (tradeValue > input.maxAmount) {
      finalQuantity = input.maxAmount / Number(originalTrade.averageEntry);
    }
  }

  // Create copy trade entry
  const copyTrade = await prisma.copyTrade.create({
    data: {
      userId: input.userId,
      originalTradeId: input.originalTradeId,
      mode: input.mode,
      status: input.mode === "MANUAL" ? "EXECUTED" : "PENDING",
      manualEntry: input.manualEntry ?? undefined,
      executedQuantity: input.mode === "MANUAL" ? finalQuantity : undefined,
      executedPrice: input.manualEntry ?? undefined,
      notes: `Copying ${originalTrade.trader.user.name}'s ${originalTrade.symbol} trade`,
      createdAt: new Date(),
    },
  });

  logger.info("Copy trade created", {
    copyTradeId: copyTrade.id,
    mode: copyTrade.mode,
    status: copyTrade.status,
    quantity: finalQuantity,
  });

  // If AUTO mode, trigger exchange execution (would be implemented separately)
  if (input.mode === "AUTO") {
    // TODO: Queue for exchange execution
    logger.info("Queueing copy trade for automatic execution", {
      copyTradeId: copyTrade.id,
    });
  }

  return copyTrade;
}

/**
 * Update copy trade with execution details
 */
export async function executeCopyTrade(
  input: ExecuteCopyTradeInput,
): Promise<CopyTrade> {
  logger.info("Executing copy trade", {
    copyTradeId: input.copyTradeId,
    exchangeOrderId: input.exchangeOrderId,
  });

  const copyTrade = await prisma.copyTrade.findUnique({
    where: { id: input.copyTradeId },
    include: {
      originalTrade: true,
    },
  });

  if (!copyTrade) {
    throw new Error("Copy trade not found");
  }

  if (copyTrade.status !== "PENDING") {
    throw new Error("Copy trade is not in PENDING status");
  }

  // Calculate slippage if not provided
  let slippage = input.slippage;
  if (slippage === undefined) {
    const originalPrice = Number(copyTrade.originalTrade.averageEntry);
    slippage = ((input.executedPrice - originalPrice) / originalPrice) * 100;
  }

  // Update copy trade with execution details
  const updatedCopy = await prisma.copyTrade.update({
    where: { id: input.copyTradeId },
    data: {
      status: "EXECUTED",
      exchangeOrderId: input.exchangeOrderId,
      executedPrice: input.executedPrice,
      executedQuantity: input.executedQuantity,
      slippage,
      executedAt: new Date(),
    },
  });

  logger.info("Copy trade executed", {
    copyTradeId: updatedCopy.id,
    executedPrice: input.executedPrice,
    executedQuantity: input.executedQuantity,
    slippage,
  });

  // Invalidate balance cache after trade execution
  // This forces fresh balance fetch on next position sizing call
  try {
    const userExchange = await prisma.userExchangeConnection.findFirst({
      where: {
        userId: copyTrade.userId,
        isActive: true,
      },
      select: {
        exchange: true,
      },
    });

    if (userExchange) {
      await invalidateCachedBalance(copyTrade.userId, userExchange.exchange);
      logger.debug("Balance cache invalidated after trade execution", {
        userId: copyTrade.userId,
        exchange: userExchange.exchange,
      });
    }
  } catch (error) {
    // Don't fail the whole operation if cache invalidation fails
    logger.warn("Failed to invalidate balance cache after trade execution", {
      userId: copyTrade.userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return updatedCopy;
}

/**
 * Cancel a pending copy trade
 */
export async function cancelCopyTrade(copyTradeId: string): Promise<CopyTrade> {
  logger.info("Cancelling copy trade", { copyTradeId });

  const copyTrade = await prisma.copyTrade.findUnique({
    where: { id: copyTradeId },
  });

  if (!copyTrade) {
    throw new Error("Copy trade not found");
  }

  if (copyTrade.status !== "PENDING") {
    throw new Error("Can only cancel pending copy trades");
  }

  const updatedCopy = await prisma.copyTrade.update({
    where: { id: copyTradeId },
    data: {
      status: "CANCELLED",
      notes: `${copyTrade.notes}\nCancelled at ${new Date().toISOString()}`,
    },
  });

  logger.info("Copy trade cancelled", { copyTradeId });

  return updatedCopy;
}

/**
 * Mark copy trade as failed
 *
 * Phase 2.2 - Enhanced error tracking with errorCode and errorDetails
 *
 * @param copyTradeId - ID of the copy trade to mark as failed
 * @param reason - Human-readable reason for failure
 * @param errorCode - Standardized error code (e.g., CIRCUIT_BREAKER_TRIPPED, INSUFFICIENT_BALANCE)
 * @param errorDetails - Full error details for debugging (stack trace, etc.)
 */
export async function failCopyTrade(
  copyTradeId: string,
  reason: string,
  errorCode?: string,
  errorDetails?: string,
): Promise<CopyTrade> {
  logger.error("Marking copy trade as failed", {
    copyTradeId,
    reason,
    errorCode,
  });

  const updatedCopy = await prisma.copyTrade.update({
    where: { id: copyTradeId },
    data: {
      status: "FAILED",
      notes: `Failed: ${reason}`,
      errorCode: errorCode ?? null,
      errorDetails: errorDetails ?? null,
    },
  });

  return updatedCopy;
}

// ============= Query Functions =============

/**
 * Get all copy trades for a user
 */
export async function getUserCopyTrades(
  userId: string,
  filters?: {
    status?: "PENDING" | "EXECUTED" | "FAILED" | "CANCELLED";
    mode?: "MANUAL" | "AUTO";
    limit?: number;
  },
): Promise<CopyTradeWithRelations[]> {
  const where: {
    userId: string;
    status?: "PENDING" | "EXECUTED" | "FAILED" | "CANCELLED";
    mode?: "MANUAL" | "AUTO";
  } = {
    userId,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.mode) {
    where.mode = filters.mode;
  }

  const copyTrades = await prisma.copyTrade.findMany({
    where,
    include: {
      originalTrade: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit ?? 100,
  });

  logger.debug("Fetched user copy trades", {
    userId,
    count: copyTrades.length,
  });

  return copyTrades;
}

/**
 * Get copy trades for an original trade
 */
export async function getTradeCopies(
  originalTradeId: string,
): Promise<CopyTradeWithRelations[]> {
  const copies = await prisma.copyTrade.findMany({
    where: {
      originalTradeId,
    },
    include: {
      originalTrade: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  logger.debug("Fetched trade copies", {
    originalTradeId,
    count: copies.length,
  });

  return copies as CopyTradeWithRelations[];
}

/**
 * Get copy trade statistics for a user
 */
export async function getUserCopyStats(
  userId: string,
): Promise<CopyTradeStats> {
  const copies = await prisma.copyTrade.findMany({
    where: { userId },
  });

  let totalVolume = 0;
  let totalSlippage = 0;
  let slippageCount = 0;

  const stats: CopyTradeStats = {
    totalCopies: copies.length,
    successfulCopies: 0,
    failedCopies: 0,
    pendingCopies: 0,
    totalVolume: 0,
    averageSlippage: 0,
  };

  for (const copy of copies) {
    switch (copy.status) {
      case "EXECUTED":
        stats.successfulCopies++;
        if (copy.executedQuantity && copy.executedPrice) {
          totalVolume +=
            Number(copy.executedQuantity) * Number(copy.executedPrice);
        }
        if (copy.slippage) {
          totalSlippage += Number(copy.slippage);
          slippageCount++;
        }
        break;
      case "FAILED":
        stats.failedCopies++;
        break;
      case "PENDING":
        stats.pendingCopies++;
        break;
    }
  }

  stats.totalVolume = totalVolume;
  stats.averageSlippage = slippageCount > 0 ? totalSlippage / slippageCount : 0;

  logger.info("Calculated copy trade stats", {
    userId,
    stats,
  });

  return stats;
}

/**
 * Check if user is copying a trader
 */
export async function isUserCopyingTrader(
  userId: string,
  traderProfileId: string,
): Promise<boolean> {
  const activeCopy = await prisma.copyTrade.findFirst({
    where: {
      userId,
      originalTrade: {
        traderProfileId,
      },
      status: { in: ["PENDING", "EXECUTED"] },
    },
  });

  return !!activeCopy;
}

/**
 * Get active copies count for a trader
 */
export async function getTraderCopiesCount(
  traderProfileId: string,
): Promise<number> {
  const count = await prisma.copyTrade.count({
    where: {
      originalTrade: {
        traderProfileId,
      },
      status: { in: ["PENDING", "EXECUTED"] },
    },
  });

  logger.debug("Trader copies count", {
    traderProfileId,
    count,
  });

  return count;
}

/**
 * Batch create copy trades for multiple users
 * Used when a popular trader opens a new position
 */
export async function batchCreateCopyTrades(
  originalTradeId: string,
  userIds: string[],
  mode: "MANUAL" | "AUTO" = "AUTO",
): Promise<{ created: number; failed: number }> {
  logger.info("Batch creating copy trades", {
    originalTradeId,
    userCount: userIds.length,
    mode,
  });

  // Create all copy trades in parallel
  const promises = userIds.map(async (userId) =>
    createCopyTrade({
      userId,
      originalTradeId,
      mode,
    }).catch((error) => {
      logger.error("Failed to create copy trade in batch", {
        userId,
        originalTradeId,
        error,
      });
      throw error;
    }),
  );

  const results = await Promise.allSettled(promises);

  let created = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      created++;
    } else {
      failed++;
    }
  }

  logger.info("Batch copy trade creation completed", {
    created,
    failed,
  });

  return { created, failed };
}

/**
 * Close all copies when original trade closes
 *
 * When a TraderTrade status changes to CLOSED, this function:
 * 1. Fetches all EXECUTED copies for this trade
 * 2. Updates each copy with exit data and PnL
 * 3. Sets closedAt timestamp
 *
 * For MANUAL copies:
 * - manualExit = original trade's averageExit
 * - manualPnl = calculated based on entry/exit difference
 *
 * For AUTO copies:
 * - Marks them for closure (future: trigger sell orders)
 */
export async function closeOriginalTradeCopies(
  originalTradeId: string,
  exitPrice: number,
): Promise<number> {
  logger.info("Closing copies for original trade", {
    originalTradeId,
    exitPrice,
  });

  // Fetch all EXECUTED copies with their original trade data
  const executedCopies = await prisma.copyTrade.findMany({
    where: {
      originalTradeId,
      status: "EXECUTED",
    },
    include: {
      originalTrade: {
        select: {
          side: true,
          averageEntry: true,
          averageExit: true,
        },
      },
    },
  });

  if (executedCopies.length === 0) {
    logger.info("No EXECUTED copies to close", { originalTradeId });
    return 0;
  }

  // Update each copy individually to calculate proper PnL
  const updatePromises = executedCopies.map(async (copy) => {
    const entryPrice =
      copy.mode === "MANUAL"
        ? Number(copy.manualEntry ?? copy.originalTrade.averageEntry)
        : Number(copy.executedPrice ?? copy.originalTrade.averageEntry);

    const quantity = Number(copy.executedQuantity ?? 0);
    const side = copy.originalTrade.side;

    // Calculate PnL based on position side
    let pnl = 0;
    if (quantity > 0) {
      if (side === "BUY") {
        // LONG position: profit = (exit - entry) * quantity
        pnl = (exitPrice - entryPrice) * quantity;
      } else {
        // SHORT position: profit = (entry - exit) * quantity
        pnl = (entryPrice - exitPrice) * quantity;
      }
    }

    // Update the copy trade with exit information
    const updatedCopy = await prisma.copyTrade.update({
      where: { id: copy.id },
      data: {
        manualExit: exitPrice,
        manualPnl: pnl,
        closedAt: new Date(),
        notes: copy.notes
          ? `${copy.notes}\n\nClosed at $${exitPrice.toFixed(2)} (PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT)`
          : `Closed at $${exitPrice.toFixed(2)} (PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT)`,
      },
    });

    // Record loss in circuit breaker if PnL is negative
    if (pnl < 0 && copy.mode === "AUTO") {
      const lossUsd = Math.abs(pnl);
      try {
        await recordLoss(copy.userId, lossUsd);
        logger.info("Loss recorded in circuit breaker", {
          userId: copy.userId,
          copyTradeId: copy.id,
          lossUsd,
        });
      } catch (error) {
        logger.error("Failed to record loss in circuit breaker", {
          userId: copy.userId,
          copyTradeId: copy.id,
          lossUsd,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return updatedCopy;
  });

  // Execute all updates in parallel
  await Promise.all(updatePromises);

  logger.info("Copies closed successfully", {
    originalTradeId,
    count: executedCopies.length,
    exitPrice,
  });

  return executedCopies.length;
}
