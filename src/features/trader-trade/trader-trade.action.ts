"use server";

/**
 * TraderTrade Server Actions
 *
 * Server-side actions for managing trader trades (positions).
 * Handles both exchange-synced and manual trades.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";
import {
  createManualTrade,
  updateManualTrade,
  closeManualTrade,
  deleteManualTrade,
} from "@/lib/trading/manual-trade.service";
import { aggregateTraderFills } from "@/lib/trading/fill-aggregation.service";

// ============= Schemas =============

const GetTraderTradesSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "PARTIAL"]).optional(),
  source: z.enum(["BINANCE", "BYBIT", "MANUAL"]).optional(),
  symbol: z.string().optional(),
  limit: z.number().min(1).max(100).default(100),
});

const GetTraderTradeByIdSchema = z.object({
  tradeId: z.string(),
});

const CreateManualTradeSchema = z.object({
  instrumentType: z.enum(["SPOT", "FUTURES"]),
  symbol: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().positive(),
  quantity: z.number().positive(),
  stopLoss: z.number().positive().optional(),
  takeProfits: z.array(z.number().positive()).optional(),
  notes: z.string().optional(),
});

const UpdateManualTradeSchema = z.object({
  tradeId: z.string(),
  exitPrice: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfits: z.array(z.number().positive()).optional(),
  notes: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED", "PARTIAL"]).optional(),
});

const CloseManualTradeSchema = z.object({
  tradeId: z.string(),
  exitPrice: z.number().positive(),
  notes: z.string().optional(),
});

const DeleteManualTradeSchema = z.object({
  tradeId: z.string(),
});

const ShareTradeAsSignalSchema = z.object({
  tradeId: z.string(),
  ttlSec: z.number().min(300).max(86400), // 5min to 24h
  leverageBand: z.string(),
  risk: z.number().min(1).max(10),
  confidence: z.number().min(1).max(10),
  rationales: z.array(z.string()),
  regime: z.string(),
  managedBy: z.enum(["AI", "HUMAN"]),
});

// ============= Actions =============

/**
 * Get all trades for the current trader
 */
export const getTraderTradesAction = authAction
  .inputSchema(GetTraderTradesSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    // Build query filters
    const where: {
      traderProfileId: string;
      status?: "OPEN" | "CLOSED" | "PARTIAL";
      source?: "BINANCE" | "BYBIT" | "MANUAL";
      symbol?: string;
    } = {
      traderProfileId: traderProfile.id,
    };

    if (parsedInput.status) {
      where.status = parsedInput.status;
    }

    if (parsedInput.source) {
      where.source = parsedInput.source;
    }

    if (parsedInput.symbol) {
      where.symbol = parsedInput.symbol.toUpperCase();
    }

    // Fetch trades
    const trades = await prisma.traderTrade.findMany({
      where,
      orderBy: {
        openedAt: "desc",
      },
      take: parsedInput.limit,
      include: {
        signals: {
          select: {
            id: true,
            symbol: true,
            expiresAt: true,
          },
        },
        copies: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    logger.info("Fetched trader trades", {
      userId: user.id,
      traderProfileId: traderProfile.id,
      count: trades.length,
    });

    return trades;
  });

/**
 * Get a single trade by ID
 */
export const getTraderTradeByIdAction = authAction
  .inputSchema(GetTraderTradeByIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    // Fetch trade with full details
    const trade = await prisma.traderTrade.findFirst({
      where: {
        id: parsedInput.tradeId,
        traderProfileId: traderProfile.id,
      },
      include: {
        fills: {
          orderBy: {
            executedAt: "asc",
          },
        },
        signals: true,
        copies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!trade) {
      throw new ActionError("Trade not found");
    }

    logger.info("Fetched trade details", {
      userId: user.id,
      tradeId: parsedInput.tradeId,
    });

    return trade;
  });

/**
 * Create a manual trade
 */
export const createManualTradeAction = authAction
  .inputSchema(CreateManualTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("You must be a trader to create trades");
    }

    // Create the manual trade
    const trade = await createManualTrade({
      ...parsedInput,
      traderProfileId: traderProfile.id,
    });

    logger.info("Created manual trade", {
      userId: user.id,
      tradeId: trade.id,
      symbol: trade.symbol,
    });

    return trade;
  });

/**
 * Update a manual trade
 */
export const updateManualTradeAction = authAction
  .inputSchema(UpdateManualTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { tradeId, ...update } = parsedInput;

    // Verify ownership
    const trade = await prisma.traderTrade.findFirst({
      where: {
        id: tradeId,
        trader: {
          userId: user.id,
        },
      },
    });

    if (!trade) {
      throw new ActionError("Trade not found or unauthorized");
    }

    if (trade.source !== "MANUAL") {
      throw new ActionError("Can only update manual trades");
    }

    // Update the trade
    const updatedTrade = await updateManualTrade(tradeId, update);

    logger.info("Updated manual trade", {
      userId: user.id,
      tradeId,
      update,
    });

    return updatedTrade;
  });

/**
 * Close a manual trade
 */
export const closeManualTradeAction = authAction
  .inputSchema(CloseManualTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { tradeId, exitPrice, notes } = parsedInput;

    // Verify ownership
    const trade = await prisma.traderTrade.findFirst({
      where: {
        id: tradeId,
        trader: {
          userId: user.id,
        },
      },
    });

    if (!trade) {
      throw new ActionError("Trade not found or unauthorized");
    }

    if (trade.source !== "MANUAL") {
      throw new ActionError("Can only close manual trades");
    }

    // Close the trade
    const closedTrade = await closeManualTrade(tradeId, exitPrice, notes);

    logger.info("Closed manual trade", {
      userId: user.id,
      tradeId,
      exitPrice,
    });

    return closedTrade;
  });

/**
 * Delete a manual trade
 */
export const deleteManualTradeAction = authAction
  .inputSchema(DeleteManualTradeSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { tradeId } = parsedInput;

    // Verify ownership
    const trade = await prisma.traderTrade.findFirst({
      where: {
        id: tradeId,
        trader: {
          userId: user.id,
        },
      },
    });

    if (!trade) {
      throw new ActionError("Trade not found or unauthorized");
    }

    if (trade.source !== "MANUAL") {
      throw new ActionError("Can only delete manual trades");
    }

    if (trade.status !== "OPEN") {
      throw new ActionError("Can only delete open trades");
    }

    // Delete the trade
    await deleteManualTrade(tradeId);

    logger.info("Deleted manual trade", {
      userId: user.id,
      tradeId,
    });

    return { success: true };
  });

/**
 * Share a trade as a signal
 */
export const shareTradeAsSignalAction = authAction
  .inputSchema(ShareTradeAsSignalSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { tradeId, ...signalData } = parsedInput;

    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    // Verify trade ownership
    const trade = await prisma.traderTrade.findFirst({
      where: {
        id: tradeId,
        traderProfileId: traderProfile.id,
      },
    });

    if (!trade) {
      throw new ActionError("Trade not found or unauthorized");
    }

    if (trade.status !== "OPEN") {
      throw new ActionError("Can only share open trades as signals");
    }

    // Create trading card payload
    const payload = {
      instrumentType: trade.instrumentType,
      bias: trade.side === "BUY" ? "LONG" : "SHORT",
      entry: Number(trade.averageEntry),
      invalidation: trade.stopLoss
        ? Number(trade.stopLoss)
        : Number(trade.averageEntry) * 0.95,
      tps: trade.takeProfit
        ? Array.isArray(trade.takeProfit)
          ? trade.takeProfit
          : [trade.takeProfit]
        : [Number(trade.averageEntry) * 1.05], // Default 5% TP
      leverageBand: signalData.leverageBand,
      risk: signalData.risk,
      confidence: signalData.confidence,
      rationales: signalData.rationales,
      regime: signalData.regime,
      managedBy: signalData.managedBy,
      version: "1.0",
    };

    // Create signal hash
    const crypto = await import("crypto");
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload) + Date.now())
      .digest("hex");

    // Create the signal
    const signal = await prisma.signal.create({
      data: {
        traderId: user.id,
        linkedTradeId: tradeId,
        symbol: trade.symbol,
        payloadJson: payload,
        ttlSec: signalData.ttlSec,
        hash,
        expiresAt: new Date(Date.now() + signalData.ttlSec * 1000),
      },
    });

    logger.info("Shared trade as signal", {
      userId: user.id,
      tradeId,
      signalId: signal.id,
    });

    return signal;
  });

/**
 * Trigger manual aggregation for the trader
 */
export const triggerAggregationAction = authAction.action(
  async ({ ctx: { user } }) => {
    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    // Trigger aggregation
    const result = await aggregateTraderFills(traderProfile.id);

    logger.info("Triggered manual aggregation", {
      userId: user.id,
      traderProfileId: traderProfile.id,
      fillsProcessed: result.fillsProcessed,
      sessionsCreated: result.sessionsCreated,
    });

    return result;
  },
);

/**
 * Get trade statistics for the current trader
 */
export const getTraderTradeStatsAction = authAction.action(
  async ({ ctx: { user } }) => {
    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    // Get all trades
    const trades = await prisma.traderTrade.findMany({
      where: {
        traderProfileId: traderProfile.id,
      },
    });

    // Calculate stats
    const totalTrades = trades.length;
    const openTrades = trades.filter((t) => t.status === "OPEN").length;
    const closedTrades = trades.filter((t) => t.status === "CLOSED").length;
    const partialTrades = trades.filter((t) => t.status === "PARTIAL").length;

    // By source
    const manualTrades = trades.filter((t) => t.source === "MANUAL").length;
    const binanceTrades = trades.filter((t) => t.source === "BINANCE").length;
    const bybitTrades = trades.filter((t) => t.source === "BYBIT").length;

    // PnL stats
    let totalRealizedPnl = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    for (const trade of trades) {
      if (trade.realizedPnl) {
        const pnl = Number(trade.realizedPnl);
        totalRealizedPnl += pnl;
        if (pnl > 0) winningTrades++;
        else if (pnl < 0) losingTrades++;
      }
    }

    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

    const stats = {
      totalTrades,
      openTrades,
      closedTrades,
      partialTrades,
      manualTrades,
      binanceTrades,
      bybitTrades,
      totalRealizedPnl,
      winningTrades,
      losingTrades,
      winRate,
    };

    logger.info("Calculated trade stats", {
      userId: user.id,
      traderProfileId: traderProfile.id,
      stats,
    });

    return stats;
  },
);
