/**
 * PnL Calculator Service
 *
 * Calculates Profit and Loss for trading positions.
 * Supports different calculation methods for Spot and Futures trading.
 *
 * Methods:
 * - FIFO (First In First Out) for Spot trading
 * - Native exchange realizedPnl for Futures
 * - WAC (Weighted Average Cost) as alternative
 *
 * @example
 * const pnl = calculateSpotPnL(fills); // Uses FIFO
 * const futurePnl = calculateFuturesPnL(fills); // Uses native PnL
 */

import { logger } from "@/lib/logger";
import type { ProcessedExchangeTrade, PnlResult } from "./types";
import { PnlMethod } from "./types";

/**
 * FIFO Queue item for tracking buy orders
 */
type FifoQueueItem = {
  quantity: number;
  price: number;
  fee: number;
  timestamp: Date;
};

/**
 * Calculate PnL using FIFO method (for Spot trading)
 *
 * FIFO matches sell orders with the oldest buy orders first.
 * This is the standard accounting method for spot trading.
 */
export function calculateSpotPnL(fills: ProcessedExchangeTrade[]): PnlResult {
  const startTime = Date.now();

  logger.debug("Calculating Spot PnL using FIFO", {
    fillCount: fills.length,
  });

  // Sort fills by execution time (oldest first)
  const sortedFills = [...fills].sort(
    (a, b) => a.executedAt.getTime() - b.executedAt.getTime(),
  );

  const buyQueue: FifoQueueItem[] = [];
  let realizedPnl = 0;
  let totalFees = 0;
  let currentPosition = 0;

  for (const fill of sortedFills) {
    totalFees += fill.fee;

    if (fill.side === "BUY") {
      // Add to buy queue
      buyQueue.push({
        quantity: fill.quantity,
        price: fill.price,
        fee: fill.fee,
        timestamp: fill.executedAt,
      });
      currentPosition += fill.quantity;
    } else {
      // SELL - match with oldest buys
      let remainingToSell = fill.quantity;
      currentPosition -= fill.quantity;

      while (remainingToSell > 0 && buyQueue.length > 0) {
        const oldestBuy = buyQueue[0];
        const soldQuantity = Math.min(remainingToSell, oldestBuy.quantity);

        // Calculate PnL for this portion
        // PnL = (sellPrice - buyPrice) * quantity
        const pnl = (fill.price - oldestBuy.price) * soldQuantity;
        realizedPnl += pnl;

        // Update quantities
        remainingToSell -= soldQuantity;
        oldestBuy.quantity -= soldQuantity;

        // Remove from queue if fully sold
        if (oldestBuy.quantity <= 0.00000001) {
          // Small epsilon for float comparison
          buyQueue.shift();
        }
      }

      // If we couldn't match all sells (short selling), log warning
      if (remainingToSell > 0.00000001) {
        logger.warn("Unmatched sell order (possible short sale)", {
          symbol: fill.symbol,
          unmatched: remainingToSell,
        });
      }
    }
  }

  // Calculate unrealized PnL (would need current market price)
  // For now, we'll leave it null as we don't have market price
  const unrealizedPnl = null;

  const duration = Date.now() - startTime;

  logger.debug("Spot PnL calculation completed", {
    realizedPnl,
    totalFees,
    netPnl: realizedPnl - totalFees,
    remainingPosition: currentPosition,
    durationMs: duration,
  });

  return {
    realizedPnl,
    unrealizedPnl,
    totalFees,
    netPnl: realizedPnl - totalFees,
    method: PnlMethod.FIFO,
  };
}

/**
 * Calculate PnL for Futures trading
 *
 * Uses the native realizedPnl from the exchange.
 * Futures exchanges typically calculate PnL including funding fees.
 */
export function calculateFuturesPnL(
  fills: ProcessedExchangeTrade[],
): PnlResult {
  logger.debug("Calculating Futures PnL using native values", {
    fillCount: fills.length,
  });

  let totalRealizedPnl = 0;
  let totalFees = 0;

  for (const fill of fills) {
    // Use native realizedPnl if available
    if (fill.realizedPnl !== null) {
      totalRealizedPnl += fill.realizedPnl;
    }
    totalFees += fill.fee;
  }

  logger.debug("Futures PnL calculation completed", {
    realizedPnl: totalRealizedPnl,
    totalFees,
    netPnl: totalRealizedPnl - totalFees,
  });

  return {
    realizedPnl: totalRealizedPnl,
    unrealizedPnl: null, // Would need open positions and mark price
    totalFees,
    netPnl: totalRealizedPnl - totalFees,
    method: PnlMethod.NATIVE,
  };
}

/**
 * Calculate PnL using Weighted Average Cost method
 *
 * Alternative to FIFO, calculates average buy price for all purchases.
 * Some traders prefer this method for tax purposes.
 */
export function calculateWacPnL(fills: ProcessedExchangeTrade[]): PnlResult {
  logger.debug("Calculating PnL using WAC method", {
    fillCount: fills.length,
  });

  let totalBuyQuantity = 0;
  let totalBuyValue = 0;
  let totalSellQuantity = 0;
  let totalSellValue = 0;
  let totalFees = 0;

  for (const fill of fills) {
    totalFees += fill.fee;

    if (fill.side === "BUY") {
      totalBuyQuantity += fill.quantity;
      totalBuyValue += fill.price * fill.quantity;
    } else {
      totalSellQuantity += fill.quantity;
      totalSellValue += fill.price * fill.quantity;
    }
  }

  // Calculate average prices
  const avgBuyPrice =
    totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;
  const avgSellPrice =
    totalSellQuantity > 0 ? totalSellValue / totalSellQuantity : 0;

  // Calculate realized PnL (only on closed portion)
  const closedQuantity = Math.min(totalBuyQuantity, totalSellQuantity);
  const realizedPnl = closedQuantity * (avgSellPrice - avgBuyPrice);

  // Remaining position
  const remainingQuantity = totalBuyQuantity - totalSellQuantity;

  logger.debug("WAC PnL calculation completed", {
    avgBuyPrice,
    avgSellPrice,
    closedQuantity,
    realizedPnl,
    totalFees,
    remainingQuantity,
  });

  return {
    realizedPnl,
    unrealizedPnl: null, // Would need current market price
    totalFees,
    netPnl: realizedPnl - totalFees,
    method: PnlMethod.WAC,
  };
}

/**
 * Calculate PnL for a mixed bag of Spot and Futures trades
 *
 * Separates fills by instrument type and uses appropriate method.
 */
export function calculateMixedPnL(fills: ProcessedExchangeTrade[]): PnlResult {
  logger.debug("Calculating mixed PnL", {
    fillCount: fills.length,
  });

  // Separate by instrument type
  const spotFills: ProcessedExchangeTrade[] = [];
  const futuresFills: ProcessedExchangeTrade[] = [];

  for (const fill of fills) {
    // Detect instrument type from symbol or metadata
    if (
      fill.symbol.includes("PERP") ||
      fill.symbol.includes("SWAP") ||
      fill.symbol.includes("-USD")
    ) {
      futuresFills.push(fill);
    } else {
      spotFills.push(fill);
    }
  }

  // Calculate separately
  const spotPnl =
    spotFills.length > 0
      ? calculateSpotPnL(spotFills)
      : {
          realizedPnl: 0,
          unrealizedPnl: null,
          totalFees: 0,
          netPnl: 0,
          method: PnlMethod.FIFO,
        };

  const futuresPnl =
    futuresFills.length > 0
      ? calculateFuturesPnL(futuresFills)
      : {
          realizedPnl: 0,
          unrealizedPnl: null,
          totalFees: 0,
          netPnl: 0,
          method: PnlMethod.NATIVE,
        };

  // Combine results
  const combinedPnl: PnlResult = {
    realizedPnl: spotPnl.realizedPnl + futuresPnl.realizedPnl,
    unrealizedPnl: null, // Would need to combine if both had unrealized
    totalFees: spotPnl.totalFees + futuresPnl.totalFees,
    netPnl: spotPnl.netPnl + futuresPnl.netPnl,
    method: PnlMethod.FIFO, // Mixed method
  };

  logger.debug("Mixed PnL calculation completed", {
    spotFills: spotFills.length,
    futuresFills: futuresFills.length,
    totalRealizedPnl: combinedPnl.realizedPnl,
    totalFees: combinedPnl.totalFees,
  });

  return combinedPnl;
}

/**
 * Estimate unrealized PnL for open positions
 *
 * Requires current market price to calculate.
 * This is a placeholder for future implementation with price feeds.
 */
export async function calculateUnrealizedPnL(
  fills: ProcessedExchangeTrade[],
  currentPrice: number,
): Promise<number> {
  logger.debug("Calculating unrealized PnL", {
    fillCount: fills.length,
    currentPrice,
  });

  let totalBuyQuantity = 0;
  let totalBuyValue = 0;
  let totalSellQuantity = 0;

  for (const fill of fills) {
    if (fill.side === "BUY") {
      totalBuyQuantity += fill.quantity;
      totalBuyValue += fill.price * fill.quantity;
    } else {
      totalSellQuantity += fill.quantity;
    }
  }

  // Net position
  const netQuantity = totalBuyQuantity - totalSellQuantity;

  if (Math.abs(netQuantity) < 0.00000001) {
    // Position is closed
    return 0;
  }

  // Average entry price
  const avgEntryPrice =
    totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;

  // Unrealized PnL = (currentPrice - avgEntryPrice) * netQuantity
  const unrealizedPnl = (currentPrice - avgEntryPrice) * netQuantity;

  logger.debug("Unrealized PnL calculated", {
    netQuantity,
    avgEntryPrice,
    currentPrice,
    unrealizedPnl,
  });

  return unrealizedPnl;
}

/**
 * Validate PnL calculation against exchange reported values
 *
 * Useful for debugging and ensuring calculation accuracy.
 */
export function validatePnlCalculation(
  calculatedPnl: number,
  exchangePnl: number,
  tolerance = 0.01, // 1 cent tolerance
): boolean {
  const difference = Math.abs(calculatedPnl - exchangePnl);
  const isValid = difference <= tolerance;

  if (!isValid) {
    logger.warn("PnL validation failed", {
      calculated: calculatedPnl,
      exchange: exchangePnl,
      difference,
      tolerance,
    });
  }

  return isValid;
}
