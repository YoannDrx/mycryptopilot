/**
 * Session Detection Service
 *
 * Analyzes raw exchange fills (ExchangeTrade) and groups them into coherent trading sessions.
 * A session represents a complete trading cycle from entry to exit on a single instrument.
 *
 * Detection Rules:
 * 1. Time Gap: New session if >24h since last trade
 * 2. Net Zero: New session if position fully closed (net quantity = 0)
 * 3. Instrument Change: New session if switching between SPOT/FUTURES
 * 4. Direction Flip: New session if LONG→SHORT or SHORT→LONG in futures
 *
 * @example
 * const sessions = await detectTradingSessions(fills, config);
 * // Returns array of TradingSession objects with grouped fills
 */

import { logger } from "@/lib/logger";
import type { ExchangeTrade } from "@/generated/prisma";
import type {
  SessionDetectionConfig,
  TradingSession,
  ProcessedExchangeTrade,
} from "./types";
import { decimalToNumber, detectInstrumentType } from "./types";
import { v4 as uuidv4 } from "uuid";

/**
 * Default configuration for session detection
 */
const DEFAULT_CONFIG: SessionDetectionConfig = {
  maxGapHours: 24,
  checkNetZero: true,
  checkInstrument: true,
  checkDirectionFlip: true,
};

/**
 * Convert ExchangeTrade to ProcessedExchangeTrade with number values
 */
function processExchangeTrade(trade: ExchangeTrade): ProcessedExchangeTrade {
  return {
    ...trade,
    quantity: decimalToNumber(trade.quantity),
    price: decimalToNumber(trade.price),
    quoteQuantity: decimalToNumber(trade.quoteQuantity),
    fee: decimalToNumber(trade.fee),
    realizedPnl: trade.realizedPnl ? decimalToNumber(trade.realizedPnl) : null,
  };
}

/**
 * Calculate weighted average price
 */
function calculateWeightedAverage(
  fills: ProcessedExchangeTrade[],
  side: "BUY" | "SELL",
): number {
  const relevantFills = fills.filter((f) => f.side === side);
  if (relevantFills.length === 0) return 0;

  const totalValue = relevantFills.reduce(
    (sum, f) => sum + f.price * f.quantity,
    0,
  );
  const totalQuantity = relevantFills.reduce((sum, f) => sum + f.quantity, 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

/**
 * Determine session status based on net quantity
 */
function determineSessionStatus(
  netQuantity: number,
  fills: ProcessedExchangeTrade[],
): "OPEN" | "CLOSED" | "PARTIAL" {
  // If net quantity is zero, position is closed
  if (Math.abs(netQuantity) < 0.00000001) {
    // Use small epsilon for float comparison
    return "CLOSED";
  }

  // Check if there were any closing trades (opposite side)
  const hasBuys = fills.some((f) => f.side === "BUY");
  const hasSells = fills.some((f) => f.side === "SELL");

  // If we have both buys and sells, it's partially closed
  if (hasBuys && hasSells) {
    return "PARTIAL";
  }

  // Otherwise it's fully open
  return "OPEN";
}

/**
 * Check if a new fill starts a new session
 */
function shouldStartNewSession(
  currentSession: TradingSession | null,
  newFill: ProcessedExchangeTrade,
  config: SessionDetectionConfig,
): boolean {
  // No current session = start new one
  if (!currentSession) return true;

  // Rule 1: Time gap check
  if (config.maxGapHours > 0) {
    const timeDiffMs =
      newFill.executedAt.getTime() - currentSession.lastActivityAt.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    if (timeDiffHours > config.maxGapHours) {
      logger.debug("Starting new session: time gap exceeded", {
        gap: timeDiffHours,
        maxGap: config.maxGapHours,
      });
      return true;
    }
  }

  // Rule 2: Net zero check (position fully closed)
  if (config.checkNetZero && currentSession.status === "CLOSED") {
    logger.debug("Starting new session: previous position fully closed");
    return true;
  }

  // Rule 3: Instrument type change
  if (config.checkInstrument) {
    const newInstrumentType = detectInstrumentType(newFill.symbol);
    if (newInstrumentType !== currentSession.instrumentType) {
      logger.debug("Starting new session: instrument type changed", {
        from: currentSession.instrumentType,
        to: newInstrumentType,
      });
      return true;
    }
  }

  // Rule 4: Direction flip for futures
  if (
    config.checkDirectionFlip &&
    currentSession.instrumentType === "FUTURES"
  ) {
    // For futures, check if we're flipping from LONG to SHORT or vice versa
    const currentNetQty = currentSession.totalQuantity;
    const newNetQty =
      newFill.side === "BUY"
        ? currentNetQty + newFill.quantity
        : currentNetQty - newFill.quantity;

    // If signs are different and both non-zero, it's a direction flip
    if (currentNetQty !== 0 && newNetQty !== 0) {
      const currentLong = currentNetQty > 0;
      const newLong = newNetQty > 0;
      if (currentLong !== newLong) {
        logger.debug("Starting new session: futures direction flip", {
          from: currentLong ? "LONG" : "SHORT",
          to: newLong ? "LONG" : "SHORT",
        });
        return true;
      }
    }
  }

  // Rule 5: Symbol change (always starts new session)
  if (newFill.symbol !== currentSession.symbol) {
    logger.debug("Starting new session: symbol changed", {
      from: currentSession.symbol,
      to: newFill.symbol,
    });
    return true;
  }

  return false;
}

/**
 * Create a new trading session from a fill
 */
function createNewSession(fill: ProcessedExchangeTrade): TradingSession {
  return {
    id: uuidv4(),
    fills: [fill],
    instrumentType: detectInstrumentType(fill.symbol),
    symbol: fill.symbol,
    side: fill.side,
    status: "OPEN",
    totalQuantity: fill.quantity * (fill.side === "BUY" ? 1 : -1),
    averageEntry: fill.price,
    averageExit: null,
    totalFees: fill.fee,
    realizedPnl: fill.realizedPnl,
    openedAt: fill.executedAt,
    closedAt: null,
    lastActivityAt: fill.executedAt,
  };
}

/**
 * Add a fill to an existing session
 */
function aggregateFillIntoSession(
  session: TradingSession,
  fill: ProcessedExchangeTrade,
): void {
  // Add fill to session
  session.fills.push(fill);

  // Update quantities
  const quantityDelta = fill.side === "BUY" ? fill.quantity : -fill.quantity;
  const previousNetQty = session.totalQuantity;
  session.totalQuantity += quantityDelta;

  // Update average prices
  if (fill.side === "BUY") {
    // Adding to position - update average entry
    const totalValue =
      session.averageEntry * Math.abs(previousNetQty) +
      fill.price * fill.quantity;
    const totalQty = Math.abs(previousNetQty) + fill.quantity;
    session.averageEntry = totalQty > 0 ? totalValue / totalQty : fill.price;
  } else {
    // Reducing position - update average exit
    const exitFills = session.fills.filter((f) => f.side === "SELL");
    session.averageExit = calculateWeightedAverage(exitFills, "SELL");
  }

  // Update fees
  session.totalFees += fill.fee;

  // Update PnL (accumulate if futures)
  if (fill.realizedPnl) {
    session.realizedPnl = (session.realizedPnl ?? 0) + fill.realizedPnl;
  }

  // Update timestamps
  session.lastActivityAt = fill.executedAt;

  // Update status
  session.status = determineSessionStatus(session.totalQuantity, session.fills);

  // Set closedAt if fully closed
  if (session.status === "CLOSED") {
    session.closedAt = fill.executedAt;
  }

  // Update side based on net position (for futures)
  if (session.instrumentType === "FUTURES" && session.totalQuantity !== 0) {
    session.side = session.totalQuantity > 0 ? "BUY" : "SELL";
  }
}

/**
 * Main function to detect trading sessions from fills
 */
export async function detectTradingSessions(
  fills: ExchangeTrade[],
  config: Partial<SessionDetectionConfig> = {},
): Promise<TradingSession[]> {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  logger.info("Starting session detection", {
    fillCount: fills.length,
    config: finalConfig,
  });

  if (fills.length === 0) {
    return [];
  }

  // Convert and sort fills by execution time
  const processedFills = fills
    .map(processExchangeTrade)
    .sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());

  const sessions: TradingSession[] = [];
  let currentSession: TradingSession | null = null;

  for (const fill of processedFills) {
    const shouldStartNew = shouldStartNewSession(
      currentSession,
      fill,
      finalConfig,
    );

    if (shouldStartNew) {
      // Save previous session if exists
      if (currentSession) {
        sessions.push(currentSession);
      }
      // Start new session
      currentSession = createNewSession(fill);
    } else if (currentSession) {
      // Add fill to existing session
      aggregateFillIntoSession(currentSession, fill);
    }
  }

  // Don't forget the last session
  if (currentSession) {
    sessions.push(currentSession);
  }

  const duration = Date.now() - startTime;

  logger.info("Session detection completed", {
    fillCount: fills.length,
    sessionCount: sessions.length,
    durationMs: duration,
    openSessions: sessions.filter((s) => s.status === "OPEN").length,
    closedSessions: sessions.filter((s) => s.status === "CLOSED").length,
    partialSessions: sessions.filter((s) => s.status === "PARTIAL").length,
  });

  return sessions;
}

/**
 * Detect sessions for a specific trader profile
 * Groups fills by connection first, then detects sessions
 */
export async function detectSessionsForTrader(
  traderProfileId: string,
  fills: ExchangeTrade[],
  config: Partial<SessionDetectionConfig> = {},
): Promise<TradingSession[]> {
  logger.info("Detecting sessions for trader", {
    traderProfileId,
    totalFills: fills.length,
  });

  // Group fills by connection (different exchanges should not mix)
  const fillsByConnection = new Map<string, ExchangeTrade[]>();

  for (const fill of fills) {
    const connectionId = fill.connectionId;
    if (!fillsByConnection.has(connectionId)) {
      fillsByConnection.set(connectionId, []);
    }
    const connectionFills = fillsByConnection.get(connectionId);
    if (connectionFills) {
      connectionFills.push(fill);
    }
  }

  // Detect sessions for each connection in parallel
  const sessionPromises = Array.from(fillsByConnection.entries()).map(
    async ([connectionId, connectionFills]) => {
      logger.debug("Processing connection", {
        connectionId,
        fillCount: connectionFills.length,
      });

      return detectTradingSessions(connectionFills, config);
    },
  );

  const sessionArrays = await Promise.all(sessionPromises);
  const allSessions = sessionArrays.flat();

  // Sort all sessions by open time
  allSessions.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());

  logger.info("Trader session detection completed", {
    traderProfileId,
    totalSessions: allSessions.length,
    connectionsProcessed: fillsByConnection.size,
  });

  return allSessions;
}

/**
 * Find unassigned fills (not yet aggregated into TraderTrade)
 * This is used for incremental aggregation
 */
export function findUnassignedFills(fills: ExchangeTrade[]): ExchangeTrade[] {
  return fills.filter((fill) => !fill.traderTradeId);
}

/**
 * Calculate summary statistics for sessions
 */
export function calculateSessionStats(sessions: TradingSession[]) {
  const totalSessions = sessions.length;
  const openSessions = sessions.filter((s) => s.status === "OPEN").length;
  const closedSessions = sessions.filter((s) => s.status === "CLOSED").length;
  const partialSessions = sessions.filter((s) => s.status === "PARTIAL").length;

  const totalFills = sessions.reduce((sum, s) => sum + s.fills.length, 0);
  const totalFees = sessions.reduce((sum, s) => sum + s.totalFees, 0);
  const totalRealizedPnl = sessions.reduce(
    (sum, s) => sum + (s.realizedPnl ?? 0),
    0,
  );

  const avgFillsPerSession = totalSessions > 0 ? totalFills / totalSessions : 0;
  const avgSessionDuration = sessions
    .filter((s) => s.closedAt)
    .reduce((sum, s) => {
      if (s.closedAt) {
        const duration = s.closedAt.getTime() - s.openedAt.getTime();
        return sum + duration;
      }
      return sum;
    }, 0);

  return {
    totalSessions,
    openSessions,
    closedSessions,
    partialSessions,
    totalFills,
    totalFees,
    totalRealizedPnl,
    avgFillsPerSession,
    avgSessionDurationMs:
      closedSessions > 0 ? avgSessionDuration / closedSessions : 0,
  };
}
