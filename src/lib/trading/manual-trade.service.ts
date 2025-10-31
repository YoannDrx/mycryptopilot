/**
 * Manual Trade Service
 *
 * Handles creation and management of manual trades (TraderTrade with source: MANUAL).
 * Allows traders to track trades not executed through connected exchanges.
 *
 * Features:
 * - Create manual trades with custom entry/exit
 * - Update trade status and prices
 * - Calculate PnL for manual trades
 * - Support stop loss and take profit levels
 *
 * @example
 * const trade = await createManualTrade({
 *   traderProfileId,
 *   symbol: "BTC/USDT",
 *   side: "BUY",
 *   entryPrice: 50000,
 *   quantity: 0.1
 * });
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { TraderTrade, Prisma } from "@/generated/prisma";
import type { CreateManualTradeInput } from "./types";

/**
 * Validate manual trade input
 */
function validateManualTradeInput(input: CreateManualTradeInput): void {
  if (input.quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  if (input.entryPrice <= 0) {
    throw new Error("Entry price must be positive");
  }

  if (input.stopLoss && input.stopLoss <= 0) {
    throw new Error("Stop loss must be positive");
  }

  if (input.takeProfits) {
    for (const tp of input.takeProfits) {
      if (tp <= 0) {
        throw new Error("Take profit levels must be positive");
      }
    }

    // For LONG trades, TPs should be above entry
    if (input.side === "BUY") {
      const invalidTp = input.takeProfits.some((tp) => tp <= input.entryPrice);
      if (invalidTp) {
        throw new Error(
          "Take profit levels must be above entry price for long trades",
        );
      }
    }

    // For SHORT trades, TPs should be below entry
    if (input.side === "SELL") {
      const invalidTp = input.takeProfits.some((tp) => tp >= input.entryPrice);
      if (invalidTp) {
        throw new Error(
          "Take profit levels must be below entry price for short trades",
        );
      }
    }
  }

  // Validate stop loss relative to entry
  if (input.stopLoss) {
    if (input.side === "BUY" && input.stopLoss >= input.entryPrice) {
      throw new Error("Stop loss must be below entry price for long trades");
    }
    if (input.side === "SELL" && input.stopLoss <= input.entryPrice) {
      throw new Error("Stop loss must be above entry price for short trades");
    }
  }
}

/**
 * Create a manual trade
 */
export async function createManualTrade(
  input: CreateManualTradeInput,
): Promise<TraderTrade> {
  logger.info("Creating manual trade", {
    traderProfileId: input.traderProfileId,
    symbol: input.symbol,
    side: input.side,
    quantity: input.quantity,
  });

  // Validate input
  validateManualTradeInput(input);

  // Check trader profile exists
  const traderProfile = await prisma.traderProfile.findUnique({
    where: { id: input.traderProfileId },
  });

  if (!traderProfile) {
    throw new Error(`Trader profile not found: ${input.traderProfileId}`);
  }

  // Create manual trade
  const trade = await prisma.traderTrade.create({
    data: {
      traderProfileId: input.traderProfileId,
      source: "MANUAL",
      instrumentType: input.instrumentType,
      symbol: input.symbol.toUpperCase(),
      status: "OPEN",
      side: input.side,
      totalQuantity: input.quantity,
      averageEntry: input.entryPrice,
      averageExit: null,
      stopLoss: input.stopLoss ?? null,
      takeProfit: input.takeProfits ?? undefined,
      realizedPnl: null,
      fees: 0, // Manual trades have no fees initially
      notes: input.notes ?? null,
      openedAt: new Date(),
      closedAt: null,
      lastActivityAt: new Date(),
    },
  });

  logger.info("Manual trade created", {
    tradeId: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.totalQuantity,
  });

  return trade;
}

/**
 * Update a manual trade
 */
export async function updateManualTrade(
  tradeId: string,
  update: {
    exitPrice?: number;
    stopLoss?: number;
    takeProfits?: number[];
    notes?: string;
    status?: "OPEN" | "CLOSED" | "PARTIAL";
  },
): Promise<TraderTrade> {
  logger.info("Updating manual trade", {
    tradeId,
    update,
  });

  // Get existing trade
  const existingTrade = await prisma.traderTrade.findUnique({
    where: { id: tradeId },
  });

  if (!existingTrade) {
    throw new Error(`Trade not found: ${tradeId}`);
  }

  if (existingTrade.source !== "MANUAL") {
    throw new Error("Can only update manual trades");
  }

  // Prepare update data
  const updateData: Prisma.TraderTradeUpdateInput = {
    lastActivityAt: new Date(),
    updatedAt: new Date(),
  };

  // Update exit price
  if (update.exitPrice !== undefined) {
    updateData.averageExit = update.exitPrice;

    // Calculate realized PnL if closing
    if (update.status === "CLOSED" || update.status === "PARTIAL") {
      const pnl = calculateManualTradePnL(
        existingTrade.side as "BUY" | "SELL",
        Number(existingTrade.averageEntry),
        update.exitPrice,
        Number(existingTrade.totalQuantity),
      );
      updateData.realizedPnl = pnl;
    }
  }

  // Update stop loss
  if (update.stopLoss !== undefined) {
    updateData.stopLoss = update.stopLoss;
  }

  // Update take profits
  if (update.takeProfits !== undefined) {
    updateData.takeProfit = update.takeProfits;
  }

  // Update notes
  if (update.notes !== undefined) {
    updateData.notes = update.notes;
  }

  // Update status
  if (update.status !== undefined) {
    updateData.status = update.status;

    if (update.status === "CLOSED") {
      updateData.closedAt = new Date();
    }
  }

  // Execute update
  const updatedTrade = await prisma.traderTrade.update({
    where: { id: tradeId },
    data: updateData,
  });

  logger.info("Manual trade updated", {
    tradeId: updatedTrade.id,
    status: updatedTrade.status,
    realizedPnl: updatedTrade.realizedPnl,
  });

  return updatedTrade;
}

/**
 * Close a manual trade
 */
export async function closeManualTrade(
  tradeId: string,
  exitPrice: number,
  notes?: string,
): Promise<TraderTrade> {
  logger.info("Closing manual trade", {
    tradeId,
    exitPrice,
  });

  return updateManualTrade(tradeId, {
    exitPrice,
    status: "CLOSED",
    notes,
  });
}

/**
 * Calculate PnL for a manual trade
 */
export function calculateManualTradePnL(
  side: "BUY" | "SELL",
  entryPrice: number,
  exitPrice: number,
  quantity: number,
): number {
  let pnl: number;

  if (side === "BUY") {
    // Long trade: profit when exit > entry
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    // Short trade: profit when exit < entry
    pnl = (entryPrice - exitPrice) * quantity;
  }

  return pnl;
}

/**
 * Get all manual trades for a trader
 */
export async function getManualTrades(
  traderProfileId: string,
  filters?: {
    status?: "OPEN" | "CLOSED" | "PARTIAL";
    symbol?: string;
    limit?: number;
  },
): Promise<TraderTrade[]> {
  logger.debug("Fetching manual trades", {
    traderProfileId,
    filters,
  });

  const where: Prisma.TraderTradeWhereInput = {
    traderProfileId,
    source: "MANUAL",
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.symbol) {
    where.symbol = filters.symbol.toUpperCase();
  }

  const trades = await prisma.traderTrade.findMany({
    where,
    orderBy: {
      openedAt: "desc",
    },
    take: filters?.limit ?? 100,
  });

  logger.debug("Manual trades fetched", {
    count: trades.length,
  });

  return trades;
}

/**
 * Delete a manual trade (only if still open)
 */
export async function deleteManualTrade(tradeId: string): Promise<void> {
  logger.info("Deleting manual trade", { tradeId });

  const trade = await prisma.traderTrade.findUnique({
    where: { id: tradeId },
  });

  if (!trade) {
    throw new Error(`Trade not found: ${tradeId}`);
  }

  if (trade.source !== "MANUAL") {
    throw new Error("Can only delete manual trades");
  }

  if (trade.status !== "OPEN") {
    throw new Error("Can only delete open trades");
  }

  await prisma.traderTrade.delete({
    where: { id: tradeId },
  });

  logger.info("Manual trade deleted", { tradeId });
}

/**
 * Calculate statistics for manual trades
 */
export async function calculateManualTradeStats(
  traderProfileId: string,
): Promise<{
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  totalPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}> {
  logger.debug("Calculating manual trade stats", { traderProfileId });

  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      source: "MANUAL",
    },
  });

  const openTrades = trades.filter((t) => t.status === "OPEN").length;
  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let totalWin = 0;
  let totalLoss = 0;

  for (const trade of closedTrades) {
    const pnl = Number(trade.realizedPnl ?? 0);
    totalPnl += pnl;

    if (pnl > 0) {
      wins++;
      totalWin += pnl;
    } else if (pnl < 0) {
      losses++;
      totalLoss += Math.abs(pnl);
    }
  }

  const stats = {
    totalTrades: trades.length,
    openTrades,
    closedTrades: closedTrades.length,
    totalPnl,
    winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
    avgWin: wins > 0 ? totalWin / wins : 0,
    avgLoss: losses > 0 ? totalLoss / losses : 0,
  };

  logger.debug("Manual trade stats calculated", stats);

  return stats;
}

/**
 * Batch update manual trades (e.g., for bulk operations)
 */
export async function batchUpdateManualTrades(
  traderProfileId: string,
  tradeIds: string[],
  update: {
    status?: "OPEN" | "CLOSED" | "PARTIAL";
    notes?: string;
  },
): Promise<number> {
  logger.info("Batch updating manual trades", {
    traderProfileId,
    tradeCount: tradeIds.length,
    update,
  });

  const result = await prisma.traderTrade.updateMany({
    where: {
      id: { in: tradeIds },
      traderProfileId,
      source: "MANUAL",
    },
    data: {
      ...update,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
      closedAt: update.status === "CLOSED" ? new Date() : undefined,
    },
  });

  logger.info("Batch update completed", {
    updated: result.count,
  });

  return result.count;
}
