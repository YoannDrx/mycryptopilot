/**
 * Genesis Trade Service
 *
 * Handles creation of "Genesis Trades" - synthetic trades representing
 * the initial portfolio state when a trader first connects their exchange.
 *
 * Purpose:
 * - When a trader connects Binance/Bybit for the first time, they may already
 *   have open positions or a trading history
 * - Genesis Trades create a baseline snapshot to avoid treating all trades
 *   as starting from zero
 *
 * Strategies:
 * 1. EMPTY_PORTFOLIO (default): Assume portfolio started empty at first sync
 * 2. SNAPSHOT_IMPORT: Manually import initial portfolio state (this service)
 * 3. FIRST_TRADE_BASELINE: Use first historical trade as baseline
 *
 * @example
 * // Create genesis trade for a trader who had 10,000 USDT initial portfolio
 * const genesis = await createGenesisTrade({
 *   traderProfileId: "trader-123",
 *   totalValue: 10000,
 *   date: new Date("2024-01-01"),
 *   notes: "Initial portfolio value when connecting Binance"
 * });
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { TraderTrade } from "@/generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export type GenesisTradeInput = {
  /** Trader profile ID */
  traderProfileId: string;

  /** Total initial portfolio value in USD (or base currency) */
  totalValue: number;

  /** Date of the portfolio snapshot (typically first sync date) */
  date: Date;

  /** Optional notes describing the genesis trade */
  notes?: string;

  /** Optional: Symbol to use (default: "GENESIS/USD") */
  symbol?: string;
};

/**
 * Create a Genesis Trade
 *
 * Creates a synthetic "MANUAL" trade with:
 * - symbol: "GENESIS/USD" (special marker)
 * - status: CLOSED
 * - realizedPnl: totalValue (represents initial portfolio value)
 * - source: MANUAL
 *
 * This trade serves as a baseline for performance calculations.
 * All subsequent trades' PnL will be calculated relative to this baseline.
 *
 * @param input - Genesis trade parameters
 * @returns Created TraderTrade record
 *
 * @throws Error if traderProfileId invalid
 * @throws Error if totalValue is negative
 *
 * @example
 * const genesis = await createGenesisTrade({
 *   traderProfileId: "clxxx",
 *   totalValue: 5000,
 *   date: new Date("2024-01-01"),
 *   notes: "Portfolio value at Binance connection"
 * });
 */
export async function createGenesisTrade(
  input: GenesisTradeInput,
): Promise<TraderTrade> {
  const { traderProfileId, totalValue, date, notes, symbol } = input;

  // Validation
  if (!traderProfileId) {
    throw new Error("traderProfileId is required");
  }

  if (totalValue < 0) {
    throw new Error("totalValue cannot be negative");
  }

  // Check if trader profile exists
  const trader = await prisma.traderProfile.findUnique({
    where: { id: traderProfileId },
    select: { id: true, displayName: true },
  });

  if (!trader) {
    throw new Error(`Trader profile not found: ${traderProfileId}`);
  }

  // Check if genesis trade already exists for this trader
  const existingGenesis = await prisma.traderTrade.findFirst({
    where: {
      traderProfileId,
      symbol: symbol ?? "GENESIS/USD",
    },
  });

  if (existingGenesis) {
    logger.warn("Genesis trade already exists for trader", {
      traderProfileId,
      existingGenesisId: existingGenesis.id,
    });
    throw new Error(
      `Genesis trade already exists for trader ${trader.displayName}`,
    );
  }

  logger.info("Creating genesis trade", {
    traderProfileId,
    traderName: trader.displayName,
    totalValue,
    date: date.toISOString(),
  });

  // Create genesis trade
  const genesisTrade = await prisma.traderTrade.create({
    data: {
      traderProfileId,
      source: "MANUAL",
      instrumentType: "SPOT", // Doesn't matter for genesis
      symbol: symbol ?? "GENESIS/USD",
      status: "CLOSED",
      side: "BUY",

      // Quantities & Prices
      totalQuantity: new Decimal(0), // Not applicable
      averageEntry: new Decimal(0), // Not applicable
      averageExit: new Decimal(0), // Not applicable

      // Performance - the key field
      realizedPnl: new Decimal(totalValue), // Initial portfolio value
      fees: new Decimal(0),

      // Risk management (not applicable)
      stopLoss: null,
      takeProfit: undefined, // Use undefined instead of null for JSON field

      // Timestamps
      openedAt: date,
      closedAt: date,
      lastActivityAt: date,

      // Notes
      notes:
        notes ??
        `Genesis Trade: Initial portfolio value of ${totalValue.toLocaleString()} USD`,
    },
  });

  logger.info("Genesis trade created successfully", {
    genesisTradeId: genesisTrade.id,
    traderProfileId,
    totalValue,
  });

  return genesisTrade;
}

/**
 * Get Genesis Trade for a trader
 *
 * @param traderProfileId - Trader profile ID
 * @returns Genesis trade or null if not found
 */
export async function getGenesisTrade(
  traderProfileId: string,
): Promise<TraderTrade | null> {
  return prisma.traderTrade.findFirst({
    where: {
      traderProfileId,
      symbol: "GENESIS/USD",
    },
  });
}

/**
 * Check if a trader has a genesis trade
 *
 * @param traderProfileId - Trader profile ID
 * @returns true if genesis trade exists
 */
export async function hasGenesisTrade(
  traderProfileId: string,
): Promise<boolean> {
  const count = await prisma.traderTrade.count({
    where: {
      traderProfileId,
      symbol: "GENESIS/USD",
    },
  });

  return count > 0;
}

/**
 * Delete Genesis Trade for a trader
 *
 * Useful if trader wants to reset their baseline or if genesis trade
 * was created by mistake.
 *
 * @param traderProfileId - Trader profile ID
 * @returns Deleted genesis trade or null if not found
 */
export async function deleteGenesisTrade(
  traderProfileId: string,
): Promise<TraderTrade | null> {
  const genesisTrade = await getGenesisTrade(traderProfileId);

  if (!genesisTrade) {
    logger.warn("No genesis trade found to delete", { traderProfileId });
    return null;
  }

  await prisma.traderTrade.delete({
    where: { id: genesisTrade.id },
  });

  logger.info("Genesis trade deleted", {
    genesisTradeId: genesisTrade.id,
    traderProfileId,
  });

  return genesisTrade;
}

/**
 * Calculate total realized PnL including genesis baseline
 *
 * Sums all closed trades' realizedPnl, including genesis trade.
 * Note: unrealizedPnl is calculated on-the-fly by unrealized-pnl.service.ts,
 * not stored in database.
 *
 * @param traderProfileId - Trader profile ID
 * @returns Total realized PnL
 */
export async function calculateTotalRealizedPnl(
  traderProfileId: string,
): Promise<number> {
  // Get all closed trades (including genesis)
  const closedTrades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      status: "CLOSED",
    },
    select: {
      realizedPnl: true,
    },
  });

  const totalRealized = closedTrades.reduce((sum, trade) => {
    return sum + (trade.realizedPnl ? Number(trade.realizedPnl) : 0);
  }, 0);

  return totalRealized;
}
