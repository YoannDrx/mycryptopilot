/**
 * Trader Trade Service
 *
 * Service for creating and managing TraderTrade records.
 * Handles mapping from Signals to TraderTrade format.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type SignalPayload = {
  asset?: string;
  bias?: "LONG" | "SHORT";
  instrumentType?: "SPOT" | "PERP";
  entry?: string;
  targets?: string[];
  stopLoss?: string;
  leverage?: number;
  riskLevel?: number;
  quantity?: string;
};

type SignalInput = {
  id: string;
  symbol: string;
  payloadJson: unknown;
};

/**
 * Create TraderTrade from Signal
 *
 * Converts a Signal into a TraderTrade record that can be referenced by CopyTrades.
 * This is necessary because CopyTrade.originalTradeId must reference TraderTrade.id,
 * not Signal.id.
 *
 * @param signal - Signal to convert
 * @param traderProfileId - Trader profile ID
 * @returns Created TraderTrade
 */
export async function createTraderTradeFromSignal(
  signal: SignalInput,
  traderProfileId: string,
): Promise<{ id: string; symbol: string; side: "BUY" | "SELL" }> {
  try {
    const payload = signal.payloadJson as SignalPayload;

    // Extract trade parameters
    const side: "BUY" | "SELL" = payload.bias === "SHORT" ? "SELL" : "BUY";
    const entryPrice = parseFloat(payload.entry ?? "0");
    const quantity = payload.quantity ? parseFloat(payload.quantity) : 0;
    const instrumentType =
      payload.instrumentType === "PERP" ? "FUTURES" : "SPOT";

    if (entryPrice === 0) {
      throw new Error("Invalid entry price in signal payload");
    }

    logger.info("Creating TraderTrade from Signal", {
      signalId: signal.id,
      symbol: signal.symbol,
      side,
      entryPrice,
      instrumentType,
    });

    // Create TraderTrade
    const traderTrade = await prisma.traderTrade.create({
      data: {
        traderProfileId,
        source: "MANUAL", // Signals are manual trades
        instrumentType,
        symbol: signal.symbol,
        status: "OPEN",
        side,

        // Quantities
        // For signals, we don't have exact quantity yet (followers will copy with their own sizing)
        // So we use a nominal 1.0 to represent "1 unit of this signal"
        totalQuantity: quantity > 0 ? quantity : 1.0, // DEPRECATED but required
        entryQuantity: quantity > 0 ? quantity : 1.0,
        exitQuantity: 0,
        netQuantity: quantity > 0 ? quantity : 1.0,

        // Prices
        averageEntry: entryPrice,
        averageExit: null,

        // Risk Management (from signal)
        stopLoss: payload.stopLoss ? parseFloat(payload.stopLoss) : null,
        takeProfit: payload.targets
          ? payload.targets.map((t) => parseFloat(t))
          : undefined, // Use undefined instead of null for JSON field

        // Performance (not calculated yet)
        realizedPnl: null,
        fees: 0,

        // Metadata in notes field (JSON string)
        notes: JSON.stringify({
          sourceSignalId: signal.id,
          signalBias: payload.bias,
          signalLeverage: payload.leverage,
          signalRiskLevel: payload.riskLevel,
        }),

        openedAt: new Date(),
        closedAt: null,
        lastActivityAt: new Date(),
      },
      select: {
        id: true,
        symbol: true,
        side: true,
      },
    });

    logger.info("TraderTrade created from Signal", {
      signalId: signal.id,
      traderTradeId: traderTrade.id,
      symbol: traderTrade.symbol,
      side: traderTrade.side,
    });

    return traderTrade;
  } catch (error) {
    logger.error("Failed to create TraderTrade from Signal", {
      signalId: signal.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get TraderTrade by Signal ID
 *
 * Finds the TraderTrade that was created from a specific Signal.
 * Uses the Signal.linkedTradeId relationship.
 *
 * @param signalId - Signal ID to search for
 * @returns TraderTrade or null
 */
export async function getTraderTradeBySignalId(
  signalId: string,
): Promise<{ id: string; symbol: string; side: "BUY" | "SELL" } | null> {
  try {
    // Get signal with linked trade
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      select: {
        linkedTrade: {
          select: {
            id: true,
            symbol: true,
            side: true,
          },
        },
      },
    });

    return signal?.linkedTrade ?? null;
  } catch (error) {
    logger.error("Failed to get TraderTrade by Signal ID", {
      signalId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Update TraderTrade status
 *
 * Updates the status of a TraderTrade (OPEN → CLOSED).
 * Used when trader closes a position.
 *
 * @param traderTradeId - TraderTrade ID
 * @param status - New status
 * @param exitPrice - Exit price (if closing)
 * @param exitQuantity - Exit quantity (if closing)
 */
export async function updateTraderTradeStatus(
  traderTradeId: string,
  status: "OPEN" | "CLOSED" | "PARTIAL",
  exitPrice?: number,
  exitQuantity?: number,
): Promise<void> {
  try {
    const updateData: {
      status: "OPEN" | "CLOSED" | "PARTIAL";
      averageExit?: number;
      exitQuantity?: number;
      netQuantity?: number;
      closedAt?: Date;
    } = {
      status,
    };

    if (exitPrice !== undefined) {
      updateData.averageExit = exitPrice;
    }

    if (exitQuantity !== undefined) {
      updateData.exitQuantity = exitQuantity;

      // Update netQuantity
      const traderTrade = await prisma.traderTrade.findUnique({
        where: { id: traderTradeId },
        select: { entryQuantity: true },
      });

      if (traderTrade) {
        updateData.netQuantity =
          Number(traderTrade.entryQuantity) - exitQuantity;
      }
    }

    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    await prisma.traderTrade.update({
      where: { id: traderTradeId },
      data: updateData,
    });

    logger.info("TraderTrade status updated", {
      traderTradeId,
      status,
      exitPrice,
      exitQuantity,
    });
  } catch (error) {
    logger.error("Failed to update TraderTrade status", {
      traderTradeId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
