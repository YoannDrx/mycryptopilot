/**
 * Unified Trading System - Type Definitions
 *
 * Core types and interfaces for the trading system
 */

import type {
  ExchangeTrade,
  TraderTrade,
  InstrumentType,
  TradeStatus,
  TradeSide,
} from "@/generated/prisma";
import type { Decimal } from "@prisma/client/runtime/library";

/**
 * Session Detection Configuration
 */
export type SessionDetectionConfig = {
  /** Maximum hours between trades to consider same session (default: 24) */
  maxGapHours: number;
  /** Check if net quantity = 0 to split sessions (default: true) */
  checkNetZero: boolean;
  /** Check for instrument type changes (default: true) */
  checkInstrument: boolean;
  /** Check for direction flip in futures (default: true) */
  checkDirectionFlip: boolean;
};

/**
 * Detected Trading Session
 * A group of fills that represent a single trading position
 */
export type TradingSession = {
  /** Unique identifier for this session */
  id: string;
  /** All fills belonging to this session */
  fills: ProcessedExchangeTrade[];
  /** Trading instrument type */
  instrumentType: InstrumentType;
  /** Symbol traded (e.g., "BTC/USDT") */
  symbol: string;
  /** Position side (BUY/SELL for spot, LONG/SHORT for futures) */
  side: TradeSide;
  /** Session status */
  status: TradeStatus;
  /** Total quantity (net position) */
  totalQuantity: number;
  /** Weighted average entry price */
  averageEntry: number;
  /** Weighted average exit price (if closed) */
  averageExit: number | null;
  /** Total fees paid */
  totalFees: number;
  /** Realized PnL (if closed or partial) */
  realizedPnl: number | null;
  /** Session start time (first fill) */
  openedAt: Date;
  /** Session end time (last fill if closed) */
  closedAt: Date | null;
  /** Last activity timestamp */
  lastActivityAt: Date;
};

/**
 * Fill Aggregation Result
 */
export type AggregationResult = {
  /** Newly created or updated TraderTrade (null if no fills to process) */
  traderTrade: TraderTrade | null;
  /** Number of fills processed */
  fillsProcessed: number;
  /** Number of new sessions created */
  sessionsCreated: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
};

/**
 * PnL Calculation Method
 */
export enum PnlMethod {
  /** First In First Out - for Spot trading */
  FIFO = "FIFO",
  /** Use native exchange realizedPnl - for Futures */
  NATIVE = "NATIVE",
  /** Weighted Average Cost - alternative for Spot */
  WAC = "WAC",
}

/**
 * PnL Calculation Result
 */
export type PnlResult = {
  /** Realized profit/loss */
  realizedPnl: number;
  /** Unrealized profit/loss (for open positions) */
  unrealizedPnl: number | null;
  /** Total fees paid */
  totalFees: number;
  /** Net PnL (realized - fees) */
  netPnl: number;
  /** Calculation method used */
  method: PnlMethod;
};

/**
 * Genesis Trade Strategy
 * How to handle existing portfolios when implementing the system
 */
export enum GenesisStrategy {
  /** Assume empty portfolio at start (default) */
  EMPTY_PORTFOLIO = "empty",
  /** Import manual snapshot of current portfolio */
  SNAPSHOT_IMPORT = "snapshot",
  /** Use first trade as baseline */
  FIRST_TRADE_BASELINE = "first",
}

/**
 * Take Profit Level
 * Structured format for TP levels with optional metadata
 */
export type TakeProfitLevel = {
  /** Price level for take profit */
  price: number;
  /** Percentage of position to close at this level (optional, default: 100) */
  percentage?: number;
  /** Whether this TP has been hit (optional, for tracking) */
  hit?: boolean;
};

/**
 * Take Profit Array Type
 * Can be either simple number array or structured TP levels
 */
export type TakeProfitArray = number[] | TakeProfitLevel[];

/**
 * Validate and normalize take profit data
 * Converts any format to structured TakeProfitLevel[]
 */
export function normalizeTakeProfits(
  takeProfits: TakeProfitArray | null | undefined,
): TakeProfitLevel[] | null {
  if (!takeProfits || takeProfits.length === 0) {
    return null;
  }

  // Check if array contains numbers or objects
  if (typeof takeProfits[0] === "number") {
    // Convert number array to structured format
    return (takeProfits as number[]).map((price) => ({
      price,
      percentage: 100,
      hit: false,
    }));
  }

  // Already structured format, validate it
  return (takeProfits as TakeProfitLevel[]).map((tp) => ({
    price: tp.price,
    percentage: tp.percentage ?? 100,
    hit: tp.hit ?? false,
  }));
}

/**
 * Parse take profit data from Prisma Json field
 */
export function parseTakeProfits(json: unknown): TakeProfitLevel[] | null {
  if (!json) return null;

  try {
    // Handle string JSON
    const data = typeof json === "string" ? JSON.parse(json) : json;

    if (!Array.isArray(data)) {
      return null;
    }

    return normalizeTakeProfits(data as TakeProfitArray);
  } catch {
    return null;
  }
}

/**
 * Manual Trade Creation Input
 */
export type CreateManualTradeInput = {
  /** Trader profile ID */
  traderProfileId: string;
  /** Trading symbol */
  symbol: string;
  /** Instrument type */
  instrumentType: InstrumentType;
  /** Trade side */
  side: TradeSide;
  /** Entry price */
  entryPrice: number;
  /** Quantity */
  quantity: number;
  /** Stop loss (optional) */
  stopLoss?: number;
  /** Take profits (optional, can be simple numbers or structured) */
  takeProfits?: TakeProfitArray;
  /** Notes (optional) */
  notes?: string;
};

/**
 * Exchange Trade with Decimal conversion helpers
 */
export type ProcessedExchangeTrade = {
  quantity: number;
  price: number;
  quoteQuantity: number;
  fee: number;
  realizedPnl: number | null;
} & Omit<
  ExchangeTrade,
  "quantity" | "price" | "quoteQuantity" | "fee" | "realizedPnl"
>;

/**
 * Utility function to convert Decimal to number
 */
export function decimalToNumber(value: Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

/**
 * Utility function to detect instrument type from symbol or exchange metadata
 */
export function detectInstrumentType(
  symbol: string,
  exchangeType?: string,
): InstrumentType {
  // If exchange explicitly provides the type
  if (
    exchangeType?.toLowerCase().includes("futures") ||
    exchangeType?.toLowerCase().includes("perp") ||
    exchangeType?.toLowerCase().includes("swap")
  ) {
    return "FUTURES";
  }

  // Check symbol patterns
  if (
    symbol.includes("PERP") ||
    symbol.includes("SWAP") ||
    symbol.includes("-USD") ||
    symbol.includes("_UMCBL")
  ) {
    // Binance futures pattern
    return "FUTURES";
  }

  return "SPOT";
}

/**
 * Utility function to normalize trading side for futures
 * Converts BUY/SELL to LONG/SHORT for futures positions
 */
export function normalizeFuturesSide(
  side: TradeSide,
  instrumentType: InstrumentType,
): TradeSide {
  if (instrumentType === "SPOT") {
    return side;
  }

  // For futures, we interpret BUY as LONG and SELL as SHORT
  // This might need adjustment based on exchange-specific conventions
  return side === "BUY" ? "BUY" : "SELL"; // Keep as-is for now, can map to LONG/SHORT if needed
}

/**
 * Circuit Breaker Configuration for Copy Trading
 */
export type CircuitBreakerConfig = {
  /** Maximum loss percentage before stopping (e.g., 10 for 10%) */
  maxLossPercent: number;
  /** Maximum number of trades per day */
  maxDailyTrades: number;
  /** Maximum position size in USD */
  maxPositionSizeUsd: number;
  /** Minimum minutes between trades */
  cooldownMinutes: number;
  /** Require manual confirmation for each trade */
  requireConfirmation: boolean;
};

/**
 * Copy Trading Feature Flags
 */
export type CopyTradingFlags = {
  /** Overall copy trading enabled */
  enabled: boolean;
  /** Auto mode enabled (vs manual only) */
  autoModeEnabled: boolean;
  /** Maximum beta users allowed */
  maxUsersBeta: number;
  /** Maximum copy value per trade in USD */
  maxCopyValueUsd: number;
  /** Maximum copies per day per user */
  maxDailyCopies: number;
};
