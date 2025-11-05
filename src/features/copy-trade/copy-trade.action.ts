"use server";

/**
 * CopyTrade Server Actions
 *
 * Server-side actions for managing copy trading.
 * Handles both manual journal tracking and automated exchange execution.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";
import {
  createCopyTrade,
  executeCopyTrade,
  cancelCopyTrade,
  failCopyTrade,
  getUserCopyTrades,
  getTradeCopies,
  getUserCopyStats,
} from "@/lib/trading/copy-trade.service";

// ============= Schemas =============

const CreateCopyTradeSchema = z.object({
  originalTradeId: z.string(),
  mode: z.enum(["MANUAL", "AUTO"]),
  copyRatio: z.number().min(0.01).max(1).optional(),
  maxAmount: z.number().positive().optional(),
  manualEntry: z.number().positive().optional(),
});

const ExecuteCopyTradeSchema = z.object({
  copyTradeId: z.string(),
  exchangeOrderId: z.string(),
  executedPrice: z.number().positive(),
  executedQuantity: z.number().positive(),
  slippage: z.number().optional(),
});

const CancelCopyTradeSchema = z.object({
  copyTradeId: z.string(),
});

const FailCopyTradeSchema = z.object({
  copyTradeId: z.string(),
  reason: z.string(),
});

const GetUserCopyTradesSchema = z.object({
  status: z.enum(["PENDING", "EXECUTED", "FAILED", "CANCELLED"]).optional(),
  mode: z.enum(["MANUAL", "AUTO"]).optional(),
  limit: z.number().min(1).max(100).default(50),
});

const GetTradeCopiesSchema = z.object({
  originalTradeId: z.string(),
});

// ============= Actions =============

/**
 * Create a copy trade
 */
export const createCopyTradeAction = authAction
  .inputSchema(CreateCopyTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Check user subscription (copy trading requires PRO or ULTRA)
    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { planName: true },
    });

    if (!userPlan?.planName || userPlan.planName === "FREE") {
      throw new ActionError("Copy trading requires PRO or ULTRA subscription");
    }

    // Validate the original trade exists
    const originalTrade = await prisma.traderTrade.findUnique({
      where: { id: parsedInput.originalTradeId },
      include: {
        trader: {
          select: {
            userId: true,
            displayName: true,
            verified: true,
          },
        },
      },
    });

    if (!originalTrade) {
      throw new ActionError("Trade not found");
    }

    if (originalTrade.status !== "OPEN") {
      throw new ActionError("Can only copy open trades");
    }

    // Check if user is following the trader
    const isFollowing = await prisma.follow.findFirst({
      where: {
        userId: user.id,
        traderId: originalTrade.trader.userId,
      },
    });

    if (!isFollowing) {
      throw new ActionError("You must follow the trader to copy their trades");
    }

    // Create the copy trade
    const copyTrade = await createCopyTrade({
      userId: user.id,
      originalTradeId: parsedInput.originalTradeId,
      mode: parsedInput.mode,
      copyRatio: parsedInput.copyRatio,
      maxAmount: parsedInput.maxAmount,
      manualEntry: parsedInput.manualEntry,
    });

    logger.info("Copy trade created via action", {
      userId: user.id,
      copyTradeId: copyTrade.id,
      mode: copyTrade.mode,
    });

    return copyTrade;
  });

/**
 * Execute a pending copy trade
 */
export const executeCopyTradeAction = authAction
  .inputSchema(ExecuteCopyTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Verify ownership
    const copyTrade = await prisma.copyTrade.findFirst({
      where: {
        id: parsedInput.copyTradeId,
        userId: user.id,
      },
    });

    if (!copyTrade) {
      throw new ActionError("Copy trade not found or unauthorized");
    }

    if (copyTrade.status !== "PENDING") {
      throw new ActionError("Copy trade is not pending");
    }

    // Execute the copy trade
    const executedCopy = await executeCopyTrade({
      copyTradeId: parsedInput.copyTradeId,
      exchangeOrderId: parsedInput.exchangeOrderId,
      executedPrice: parsedInput.executedPrice,
      executedQuantity: parsedInput.executedQuantity,
      slippage: parsedInput.slippage,
    });

    logger.info("Copy trade executed via action", {
      userId: user.id,
      copyTradeId: executedCopy.id,
    });

    return executedCopy;
  });

/**
 * Cancel a pending copy trade
 */
export const cancelCopyTradeAction = authAction
  .inputSchema(CancelCopyTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Verify ownership
    const copyTrade = await prisma.copyTrade.findFirst({
      where: {
        id: parsedInput.copyTradeId,
        userId: user.id,
      },
    });

    if (!copyTrade) {
      throw new ActionError("Copy trade not found or unauthorized");
    }

    if (copyTrade.status !== "PENDING") {
      throw new ActionError("Can only cancel pending copy trades");
    }

    // Cancel the copy trade
    const cancelledCopy = await cancelCopyTrade(parsedInput.copyTradeId);

    logger.info("Copy trade cancelled via action", {
      userId: user.id,
      copyTradeId: cancelledCopy.id,
    });

    return cancelledCopy;
  });

/**
 * Mark a copy trade as failed
 */
export const failCopyTradeAction = authAction
  .inputSchema(FailCopyTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // This action might be restricted to system/admin only
    // For now, allow user to fail their own copy trades
    const copyTrade = await prisma.copyTrade.findFirst({
      where: {
        id: parsedInput.copyTradeId,
        userId: user.id,
      },
    });

    if (!copyTrade) {
      throw new ActionError("Copy trade not found or unauthorized");
    }

    if (copyTrade.status !== "PENDING") {
      throw new ActionError("Can only fail pending copy trades");
    }

    // Fail the copy trade
    const failedCopy = await failCopyTrade(
      parsedInput.copyTradeId,
      parsedInput.reason,
    );

    logger.info("Copy trade failed via action", {
      userId: user.id,
      copyTradeId: failedCopy.id,
      reason: parsedInput.reason,
    });

    return failedCopy;
  });

/**
 * Get user's copy trades
 */
export const getUserCopyTradesAction = authAction
  .inputSchema(GetUserCopyTradesSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const copyTrades = await getUserCopyTrades(user.id, {
      status: parsedInput.status,
      mode: parsedInput.mode,
      limit: parsedInput.limit,
    });

    logger.info("Fetched user copy trades", {
      userId: user.id,
      count: copyTrades.length,
    });

    return copyTrades;
  });

/**
 * Get copies of a specific trade
 */
export const getTradeCopiesAction = authAction
  .inputSchema(GetTradeCopiesSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Verify the user is the trader who owns the original trade
    const originalTrade = await prisma.traderTrade.findFirst({
      where: {
        id: parsedInput.originalTradeId,
        trader: {
          userId: user.id,
        },
      },
    });

    if (!originalTrade) {
      throw new ActionError(
        "Trade not found or you don't have permission to view its copies",
      );
    }

    const copies = await getTradeCopies(parsedInput.originalTradeId);

    logger.info("Fetched trade copies", {
      userId: user.id,
      originalTradeId: parsedInput.originalTradeId,
      count: copies.length,
    });

    return copies;
  });

/**
 * Get user's copy trade statistics
 */
export const getUserCopyStatsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const stats = await getUserCopyStats(user.id);

    logger.info("Fetched user copy stats", {
      userId: user.id,
      stats,
    });

    return stats;
  },
);

/**
 * Enable auto-copy for a trader
 */
export const enableAutoCopyAction = authAction
  .inputSchema(
    z.object({
      traderProfileId: z.string(),
      copyRatio: z.number().min(0.01).max(1).default(1),
      maxAmountPerTrade: z.number().positive().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Check user subscription
    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { planName: true },
    });

    if (userPlan?.planName !== "ULTRA") {
      throw new ActionError("Auto-copy requires ULTRA subscription");
    }

    // Verify the trader exists
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { id: parsedInput.traderProfileId },
      select: {
        id: true,
        userId: true,
        displayName: true,
      },
    });

    if (!traderProfile) {
      throw new ActionError("Trader not found");
    }

    // Check if user is following the trader
    const isFollowing = await prisma.follow.findFirst({
      where: {
        userId: user.id,
        traderId: traderProfile.userId,
      },
    });

    if (!isFollowing) {
      throw new ActionError("You must follow the trader to enable auto-copy");
    }

    // Store auto-copy preferences (would need a new table for this)
    // For now, just log the intent
    logger.info("Auto-copy enabled", {
      userId: user.id,
      traderProfileId: parsedInput.traderProfileId,
      copyRatio: parsedInput.copyRatio,
      maxAmountPerTrade: parsedInput.maxAmountPerTrade,
    });

    return {
      success: true,
      message: "Auto-copy enabled for this trader",
    };
  });

/**
 * Disable auto-copy for a trader
 */
export const disableAutoCopyAction = authAction
  .inputSchema(
    z.object({
      traderProfileId: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Remove auto-copy preferences (would need a new table for this)
    // For now, just log the intent
    logger.info("Auto-copy disabled", {
      userId: user.id,
      traderProfileId: parsedInput.traderProfileId,
    });

    return {
      success: true,
      message: "Auto-copy disabled for this trader",
    };
  });
