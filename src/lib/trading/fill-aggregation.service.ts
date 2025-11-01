/**
 * Fill Aggregation Service
 *
 * Aggregates raw exchange fills (ExchangeTrade) into TraderTrade positions.
 * Works in conjunction with SessionDetectionService to create meaningful trading positions.
 *
 * Features:
 * - Creates TraderTrade records from detected sessions
 * - Links ExchangeTrade fills to their aggregated TraderTrade
 * - Supports incremental aggregation (only processes unassigned fills)
 * - Calculates aggregate metrics (averages, totals, PnL)
 *
 * @example
 * const result = await aggregateTraderFills(traderProfileId, fills);
 * console.log(`Created ${result.sessionsCreated} new positions`);
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { ExchangeTrade, TraderTrade } from "@/generated/prisma";
import type {
  TradingSession,
  AggregationResult,
  ProcessedExchangeTrade,
} from "./types";
import {
  detectSessionsForTrader,
  findUnassignedFills,
  calculateSessionStats,
} from "./session-detection.service";
import {
  calculateSpotPnL,
  calculateFuturesPnL,
} from "./pnl-calculator.service";

/**
 * Convert ExchangeTrade (with Decimal types) to ProcessedExchangeTrade (with number types)
 * This is needed for PnL calculation which expects number types
 */
function convertToProcessedFill(fill: ExchangeTrade): ProcessedExchangeTrade {
  return {
    ...fill,
    quantity: Number(fill.quantity),
    price: Number(fill.price),
    quoteQuantity: Number(fill.quoteQuantity),
    fee: Number(fill.fee),
    realizedPnl: fill.realizedPnl ? Number(fill.realizedPnl) : null,
  };
}

/**
 * Calculate detailed position quantities from fills
 * Tracks entry, exit, and net quantities separately for accurate PnL calculation
 */
function calculatePositionQuantities(session: TradingSession): {
  entryQuantity: number;
  exitQuantity: number;
  netQuantity: number;
  totalQuantity: number; // DEPRECATED: for backward compatibility
} {
  // Calculate entry and exit quantities based on position side
  let entryQuantity = 0;
  let exitQuantity = 0;

  for (const fill of session.fills) {
    if (session.side === "BUY") {
      // Long position: entry = buys, exit = sells
      if (fill.side === "BUY") {
        entryQuantity += fill.quantity;
      } else {
        exitQuantity += fill.quantity;
      }
    } else {
      // Short position: entry = sells, exit = buys
      if (fill.side === "SELL") {
        entryQuantity += fill.quantity;
      } else {
        exitQuantity += fill.quantity;
      }
    }
  }

  const netQuantity = entryQuantity - exitQuantity;

  // DEPRECATED totalQuantity: for backward compatibility
  // For closed positions, use max of entry/exit
  // For open/partial, use absolute net quantity
  const totalQuantity =
    session.status === "CLOSED"
      ? Math.max(entryQuantity, exitQuantity)
      : Math.abs(netQuantity);

  return {
    entryQuantity,
    exitQuantity,
    netQuantity,
    totalQuantity,
  };
}

/**
 * Create a TraderTrade from a trading session
 */
async function createTraderTradeFromSession(
  traderProfileId: string,
  session: TradingSession,
): Promise<TraderTrade> {
  logger.debug("Creating TraderTrade from session", {
    sessionId: session.id,
    symbol: session.symbol,
    status: session.status,
    fillCount: session.fills.length,
  });

  // Determine source from first fill (all fills in session are from same connection)
  const firstFill = session.fills[0];
  // firstFill is guaranteed to exist as sessions always have at least one fill

  // Get connection to determine exchange
  const connection = await prisma.exchangeConnection.findUnique({
    where: { id: firstFill.connectionId },
    select: { exchange: true },
  });

  if (!connection) {
    throw new Error(`Connection not found: ${firstFill.connectionId}`);
  }

  // Calculate PnL based on instrument type
  const pnlResult =
    session.instrumentType === "SPOT"
      ? calculateSpotPnL(session.fills)
      : calculateFuturesPnL(session.fills);

  // Calculate position quantities (entry, exit, net)
  const quantities = calculatePositionQuantities(session);

  // Create TraderTrade
  const traderTrade = await prisma.traderTrade.create({
    data: {
      traderProfileId,
      source: connection.exchange,
      instrumentType: session.instrumentType,
      symbol: session.symbol,
      status: session.status,
      side: session.side,
      totalQuantity: quantities.totalQuantity, // DEPRECATED: kept for backward compatibility
      entryQuantity: quantities.entryQuantity,
      exitQuantity: quantities.exitQuantity,
      netQuantity: quantities.netQuantity,
      averageEntry: session.averageEntry,
      averageExit: session.averageExit,
      stopLoss: null, // Phase 1: No SL/TP from exchange
      takeProfit: undefined, // Phase 1: No SL/TP from exchange
      realizedPnl:
        session.status === "CLOSED" || session.status === "PARTIAL"
          ? pnlResult.realizedPnl
          : null,
      fees: session.totalFees,
      notes: null,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      lastActivityAt: session.lastActivityAt,
    },
  });

  logger.info("Created TraderTrade from session", {
    traderTradeId: traderTrade.id,
    symbol: traderTrade.symbol,
    status: traderTrade.status,
    entryQuantity: quantities.entryQuantity,
    exitQuantity: quantities.exitQuantity,
    netQuantity: quantities.netQuantity,
    realizedPnl: traderTrade.realizedPnl,
  });

  return traderTrade;
}

/**
 * Update an existing TraderTrade with new fills
 */
async function updateTraderTradeFromSession(
  traderTradeId: string,
  session: TradingSession,
): Promise<TraderTrade> {
  logger.debug("Updating TraderTrade from session", {
    traderTradeId,
    sessionId: session.id,
    status: session.status,
    newFills: session.fills.length,
  });

  // CRITICAL: Fetch ALL existing fills for this TraderTrade
  // We need to recalculate PnL on ALL fills (old + new), not just new ones
  const existingFills = await prisma.exchangeTrade.findMany({
    where: { traderTradeId },
    orderBy: { executedAt: "asc" },
  });

  logger.debug("Fetched existing fills for PnL recalculation", {
    traderTradeId,
    existingFillsCount: existingFills.length,
    newFillsCount: session.fills.length,
  });

  // Convert existing fills from Decimal to number types
  const existingProcessedFills = existingFills.map(convertToProcessedFill);

  // Combine existing fills with new fills for complete PnL calculation
  const allFills = [...existingProcessedFills, ...session.fills];

  // Calculate PnL based on instrument type using ALL fills
  const pnlResult =
    session.instrumentType === "SPOT"
      ? calculateSpotPnL(allFills)
      : calculateFuturesPnL(allFills);

  // Calculate position quantities from ALL fills
  const allFillsSession: TradingSession = { ...session, fills: allFills };
  const quantities = calculatePositionQuantities(allFillsSession);

  // Update TraderTrade
  const traderTrade = await prisma.traderTrade.update({
    where: { id: traderTradeId },
    data: {
      status: session.status,
      side: session.side,
      totalQuantity: quantities.totalQuantity, // DEPRECATED: kept for backward compatibility
      entryQuantity: quantities.entryQuantity,
      exitQuantity: quantities.exitQuantity,
      netQuantity: quantities.netQuantity,
      averageEntry: session.averageEntry,
      averageExit: session.averageExit,
      realizedPnl:
        session.status === "CLOSED" || session.status === "PARTIAL"
          ? pnlResult.realizedPnl
          : null,
      fees: session.totalFees,
      closedAt: session.closedAt,
      lastActivityAt: session.lastActivityAt,
      updatedAt: new Date(),
    },
  });

  logger.info("Updated TraderTrade from session", {
    traderTradeId: traderTrade.id,
    status: traderTrade.status,
    entryQuantity: quantities.entryQuantity,
    exitQuantity: quantities.exitQuantity,
    netQuantity: quantities.netQuantity,
    realizedPnl: traderTrade.realizedPnl,
  });

  return traderTrade;
}

/**
 * Link ExchangeTrade fills to their TraderTrade
 */
async function linkFillsToTraderTrade(
  traderTradeId: string,
  fillIds: string[],
): Promise<number> {
  logger.debug("Linking fills to TraderTrade", {
    traderTradeId,
    fillCount: fillIds.length,
  });

  const result = await prisma.exchangeTrade.updateMany({
    where: {
      id: { in: fillIds },
    },
    data: {
      traderTradeId,
    },
  });

  logger.info("Linked fills to TraderTrade", {
    traderTradeId,
    fillsLinked: result.count,
  });

  return result.count;
}

/**
 * Find existing TraderTrade that matches a session
 * Used to determine if we should create new or update existing
 */
async function findMatchingTraderTrade(
  traderProfileId: string,
  session: TradingSession,
): Promise<TraderTrade | null> {
  // Look for open/partial TraderTrade with same symbol and side
  const existingTrade = await prisma.traderTrade.findFirst({
    where: {
      traderProfileId,
      symbol: session.symbol,
      instrumentType: session.instrumentType,
      side: session.side, // CRITICAL: Must match side to prevent merging opposite positions
      status: { in: ["OPEN", "PARTIAL"] },
    },
    orderBy: {
      lastActivityAt: "desc",
    },
  });

  if (!existingTrade) {
    return null;
  }

  // Check if this session is a continuation of the existing trade
  const timeDiffMs =
    session.openedAt.getTime() - existingTrade.lastActivityAt.getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

  // If more than 24h gap, consider it a new trade
  if (timeDiffHours > 24) {
    return null;
  }

  return existingTrade;
}

/**
 * Main aggregation function for a trader's fills
 */
export async function aggregateTraderFills(
  traderProfileId: string,
  fills?: ExchangeTrade[],
): Promise<AggregationResult> {
  const startTime = Date.now();

  logger.info("Starting fill aggregation for trader", {
    traderProfileId,
    providedFills: fills?.length ?? 0,
  });

  // If no fills provided, fetch all unassigned fills for this trader
  let fillsToProcess = fills;
  if (!fillsToProcess) {
    fillsToProcess = await prisma.exchangeTrade.findMany({
      where: {
        connection: {
          traderProfileId,
        },
        traderTradeId: null, // Only unassigned fills
      },
      orderBy: {
        executedAt: "asc",
      },
    });

    logger.info("Fetched unassigned fills", {
      count: fillsToProcess.length,
    });
  } else {
    // Filter to only unassigned fills
    fillsToProcess = findUnassignedFills(fillsToProcess);
    logger.info("Filtered to unassigned fills", {
      original: fills?.length ?? 0,
      unassigned: fillsToProcess.length,
    });
  }

  if (fillsToProcess.length === 0) {
    logger.info("No fills to process");
    // Return proper null result when no fills to process
    const emptyResult: AggregationResult = {
      traderTrade: null,
      fillsProcessed: 0,
      sessionsCreated: 0,
      processingTimeMs: Date.now() - startTime,
    };
    return emptyResult;
  }

  // Detect trading sessions
  const sessions = await detectSessionsForTrader(
    traderProfileId,
    fillsToProcess,
  );

  logger.info("Detected trading sessions", {
    sessionCount: sessions.length,
    stats: calculateSessionStats(sessions),
  });

  // Process each session with proper async handling
  let sessionsCreated = 0;
  let lastTraderTrade: TraderTrade | null = null;

  // Process sessions sequentially as they may depend on each other
  const processedSessions: TraderTrade[] = [];

  // Sessions must be processed sequentially to maintain order and dependencies

  for (const session of sessions) {
    // Check if this session matches an existing open trade
    // eslint-disable-next-line no-await-in-loop
    const existingTrade = await findMatchingTraderTrade(
      traderProfileId,
      session,
    );

    let traderTrade: TraderTrade;

    if (existingTrade) {
      // Update existing trade
      // eslint-disable-next-line no-await-in-loop
      traderTrade = await updateTraderTradeFromSession(
        existingTrade.id,
        session,
      );
    } else {
      // Create new trade
      // eslint-disable-next-line no-await-in-loop
      traderTrade = await createTraderTradeFromSession(
        traderProfileId,
        session,
      );
      sessionsCreated++;
    }

    // Link fills to TraderTrade
    const fillIds = session.fills.map((f) => f.id);
    // eslint-disable-next-line no-await-in-loop
    await linkFillsToTraderTrade(traderTrade.id, fillIds);

    processedSessions.push(traderTrade);
    lastTraderTrade = traderTrade;
  }

  const processingTimeMs = Date.now() - startTime;

  logger.info("Fill aggregation completed", {
    traderProfileId,
    fillsProcessed: fillsToProcess.length,
    sessionsCreated,
    sessionsUpdated: sessions.length - sessionsCreated,
    durationMs: processingTimeMs,
  });

  return {
    traderTrade: lastTraderTrade,
    fillsProcessed: fillsToProcess.length,
    sessionsCreated,
    processingTimeMs,
  };
}

/**
 * Aggregate all fills for all traders (batch job)
 */
export async function aggregateAllTradersFills(): Promise<void> {
  logger.info("Starting batch aggregation for all traders");

  // Get all traders with unassigned fills
  const tradersWithUnassignedFills = await prisma.traderProfile.findMany({
    where: {
      exchangeConnections: {
        some: {
          trades: {
            some: {
              traderTradeId: null,
            },
          },
        },
      },
    },
    select: {
      id: true,
      displayName: true,
    },
  });

  logger.info("Found traders with unassigned fills", {
    count: tradersWithUnassignedFills.length,
  });

  // Process each trader sequentially to avoid overloading database
  for (const trader of tradersWithUnassignedFills) {
    try {
      logger.info("Processing trader", {
        traderProfileId: trader.id,
        displayName: trader.displayName,
      });

      // Process traders sequentially to manage database load
      // eslint-disable-next-line no-await-in-loop
      const result = await aggregateTraderFills(trader.id);

      logger.info("Trader processing completed", {
        traderProfileId: trader.id,
        fillsProcessed: result.fillsProcessed,
        sessionsCreated: result.sessionsCreated,
      });
    } catch (error) {
      logger.error("Failed to process trader", {
        traderProfileId: trader.id,
        error,
      });
      // Continue with next trader
    }
  }

  logger.info("Batch aggregation completed");
}

/**
 * Re-aggregate all fills for a trader (full recalculation)
 * Useful for fixing data inconsistencies
 */
export async function reAggregateTraderFills(
  traderProfileId: string,
): Promise<AggregationResult> {
  logger.info("Starting full re-aggregation for trader", {
    traderProfileId,
  });

  // Clear existing TraderTrade links
  await prisma.exchangeTrade.updateMany({
    where: {
      connection: {
        traderProfileId,
      },
    },
    data: {
      traderTradeId: null,
    },
  });

  // Delete existing TraderTrades
  await prisma.traderTrade.deleteMany({
    where: {
      traderProfileId,
    },
  });

  logger.info("Cleared existing aggregations", {
    traderProfileId,
  });

  // Re-aggregate all fills
  return aggregateTraderFills(traderProfileId);
}

/**
 * Genesis Trade Creation for existing portfolios
 * Creates a synthetic "genesis" trade to represent initial portfolio state
 */
export async function createGenesisTrade(
  traderProfileId: string,
  initialValue: number,
  notes?: string,
): Promise<TraderTrade> {
  logger.info("Creating genesis trade", {
    traderProfileId,
    initialValue,
  });

  const genesisTrade = await prisma.traderTrade.create({
    data: {
      traderProfileId,
      source: "MANUAL",
      instrumentType: "SPOT",
      symbol: "GENESIS",
      status: "CLOSED",
      side: "BUY",
      totalQuantity: 0,
      averageEntry: 0,
      averageExit: 0,
      realizedPnl: initialValue,
      fees: 0,
      notes:
        notes ??
        `Genesis Trade: Initial portfolio value of ${initialValue} USD`,
      openedAt: new Date(),
      closedAt: new Date(),
      lastActivityAt: new Date(),
    },
  });

  logger.info("Genesis trade created", {
    traderTradeId: genesisTrade.id,
    initialValue,
  });

  return genesisTrade;
}
