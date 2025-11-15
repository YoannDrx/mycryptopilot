/**
 * Position Sizing Service
 *
 * Calculates safe position sizes for copy-trading based on:
 * - User's available balance
 * - Copy ratio preference
 * - Maximum amount limits
 * - Exchange minimum requirements
 *
 * Prevents over-sizing positions that could liquidate or ruin accounts.
 *
 * @example
 * const quantity = await calculateSafeQuantity({
 *   userId: "user123",
 *   exchange: "BINANCE",
 *   apiKey: "...",
 *   secretKey: "...",
 *   symbol: "BTCUSDT",
 *   entryPrice: 50000,
 *   instrumentType: "SPOT",
 *   copyRatio: 0.1,  // 10% of portfolio
 *   maxAmount: 1000,  // Cap at $1000
 * });
 * // Returns: 0.02 BTC (worth $1000, 10% of $10k portfolio)
 */

import { logger } from "@/lib/logger";
import { createExchangeService } from "./exchange-service-factory";
import type { Exchange } from "@/generated/prisma";
import type { Decimal } from "@prisma/client/runtime/library";
import { getCachedBalance, setCachedBalance } from "./balance-cache.service";
import {
  getFreshSnapshotForConnection,
  persistBalanceSnapshot,
} from "./balance-snapshot.service";
import type { ConsolidatedBalance } from "./types";

export type CalculateSafeQuantityInput = {
  // User identification
  userId: string;
  connectionId?: string;

  // Exchange connection
  exchange: Exchange; // "BINANCE" or "BYBIT"
  apiKey: string;
  secretKey: string;
  passphrase?: string | null;
  bitgetAccountMode?: "UTA" | "CLASSIC" | null;

  // Trade parameters
  symbol: string; // e.g., "BTCUSDT"
  entryPrice: number; // Entry price in quote currency (USDT)
  instrumentType: "SPOT" | "PERP" | "FUTURES"; // Type of instrument

  // Risk configuration
  copyRatio: number; // Percentage of portfolio to allocate (0.01 = 1%)
  maxAmount?: Decimal | number | null; // Maximum USD amount cap
};

export type SafeQuantityResult = {
  quantity: number; // Calculated quantity in base asset
  positionSizeUsd: number; // Position size in USD
  availableBalanceUsd: number; // User's available balance
  limitApplied:
    | "none"
    | "copyRatio"
    | "maxAmount"
    | "exchangeMinimum"
    | "insufficientBalance"; // Which limit was applied
  warnings: string[]; // Any warnings about the calculation
};

const ensureBalance = (
  balance: ConsolidatedBalance | null,
): ConsolidatedBalance => {
  if (!balance) {
    throw new Error("Unable to fetch balance for sizing");
  }
  return balance;
};

/**
 * Exchange minimums for common pairs
 * These are approximate minimums, actual values vary by exchange
 *
 * TODO: Fetch these dynamically from exchange API (via ccxt markets)
 */
const EXCHANGE_MINIMUMS: Record<
  string,
  { minNotionalUsd: number; minQuantity: number }
> = {
  // BTC pairs
  BTCUSDT: { minNotionalUsd: 10, minQuantity: 0.00001 },
  BTCUSD: { minNotionalUsd: 10, minQuantity: 0.00001 },

  // ETH pairs
  ETHUSDT: { minNotionalUsd: 10, minQuantity: 0.0001 },
  ETHUSD: { minNotionalUsd: 10, minQuantity: 0.0001 },

  // Other major pairs
  BNBUSDT: { minNotionalUsd: 10, minQuantity: 0.001 },
  SOLUSDT: { minNotionalUsd: 10, minQuantity: 0.01 },
  ADAUSDT: { minNotionalUsd: 10, minQuantity: 1 },
  DOGEUSDT: { minNotionalUsd: 10, minQuantity: 10 },

  // Default fallback
  DEFAULT: { minNotionalUsd: 10, minQuantity: 0.00001 },
};

/**
 * Get exchange minimums for a symbol
 *
 * @param symbol - Trading pair symbol (e.g., "BTCUSDT")
 * @returns Minimum notional and quantity requirements
 */
function getExchangeMinimums(symbol: string): {
  minNotionalUsd: number;
  minQuantity: number;
} {
  return EXCHANGE_MINIMUMS[symbol] ?? EXCHANGE_MINIMUMS.DEFAULT;
}

/**
 * Round quantity to valid precision for the symbol
 *
 * Different assets have different precision requirements:
 * - BTC: 8 decimals (0.00000001)
 * - ETH: 4 decimals (0.0001)
 * - DOGE: 0 decimals (1)
 *
 * @param symbol - Trading pair symbol
 * @param quantity - Raw quantity to round
 * @returns Rounded quantity
 */
function roundToValidPrecision(symbol: string, quantity: number): number {
  // Determine precision based on asset
  let precision = 8; // Default for BTC-like assets

  if (symbol.startsWith("BTC")) {
    precision = 8;
  } else if (symbol.startsWith("ETH")) {
    precision = 4;
  } else if (symbol.startsWith("DOGE") || symbol.startsWith("SHIB")) {
    precision = 0; // Whole numbers for cheap coins
  } else if (symbol.startsWith("SOL") || symbol.startsWith("BNB")) {
    precision = 2;
  } else {
    precision = 4; // Default for most altcoins
  }

  const multiplier = Math.pow(10, precision);
  return Math.floor(quantity * multiplier) / multiplier;
}

/**
 * Calculate safe quantity for copy-trading
 *
 * Process:
 * 1. Fetch user's actual balance from exchange
 * 2. Calculate available USD for trading (spot vs futures)
 * 3. Apply copyRatio to determine position size
 * 4. Apply maxAmount cap if specified
 * 5. Ensure minimum notional requirement met
 * 6. Round to valid precision
 *
 * @param input - Calculation parameters
 * @returns Safe quantity and metadata
 * @throws Error if balance fetch fails or inputs invalid
 */
export async function calculateSafeQuantity(
  input: CalculateSafeQuantityInput,
): Promise<SafeQuantityResult> {
  const {
    userId,
    connectionId,
    exchange,
    apiKey,
    secretKey,
    passphrase,
    bitgetAccountMode,
    symbol,
    entryPrice,
    instrumentType,
    copyRatio,
    maxAmount,
  } = input;

  const warnings: string[] = [];

  try {
    // ========== Step 1: Validate Inputs ==========

    if (entryPrice <= 0) {
      throw new Error("Entry price must be positive");
    }

    if (copyRatio <= 0 || copyRatio > 1) {
      throw new Error("Copy ratio must be between 0 and 1");
    }

    logger.debug("Calculating safe quantity", {
      userId,
      symbol,
      entryPrice,
      instrumentType,
      copyRatio,
      maxAmount: maxAmount
        ? typeof maxAmount === "number"
          ? maxAmount
          : maxAmount.toNumber()
        : null,
    });

    // ========== Step 2: Fetch User Balance (with Redis cache) ==========

    // Try to get cached balance first (TTL: 30s)
    let balanceSource: "cache" | "snapshot" | "live" = "cache";
    let balance = await getCachedBalance(userId, exchange);

    if (balance) {
      logger.debug("Balance cache hit (50ms)", {
        userId,
        exchange,
        totalEquityUsd: balance.totalEquityUsd,
      });
    } else {
      if (connectionId) {
        const snapshot = await getFreshSnapshotForConnection(connectionId);
        if (snapshot) {
          balance = snapshot.balance;
          balanceSource = "snapshot";
          await setCachedBalance(userId, exchange, balance);
          logger.debug("Balance snapshot reused for sizing", {
            userId,
            exchange,
            connectionId,
          });
        }
      }
    }

    if (!balance) {
      balanceSource = "live";
      // Cache miss - fetch from exchange API (2000ms)
      const exchangeService = createExchangeService(
        exchange,
        apiKey,
        secretKey,
        {
          passphrase,
          bitgetAccountMode: bitgetAccountMode ?? undefined,
        },
      );

      try {
        balance = await exchangeService.fetchConsolidatedBalance();

        logger.debug("Balance fetched from API (2000ms)", {
          userId,
          exchange,
          totalEquityUsd: balance.totalEquityUsd,
          spotTotalUsd: balance.spot.totalUsd,
          futuresAvailable: balance.futures?.marginAvailable,
        });

        // Cache the balance for 30 seconds
        await setCachedBalance(userId, exchange, balance);

        if (connectionId) {
          await persistBalanceSnapshot({
            connectionId,
            userId,
            exchange,
            balance,
          });
        }
      } finally {
        // Always close connection
        await exchangeService.close();
      }
    }

    const resolvedBalance = ensureBalance(balance);

    // ========== Step 3: Determine Available Balance ==========

    let availableBalanceUsd: number;

    if (instrumentType === "SPOT") {
      // For spot trades, use spot balance
      availableBalanceUsd = resolvedBalance.spot.totalUsd;
    } else {
      // For futures/perp trades, use futures margin available
      if (!resolvedBalance.futures) {
        throw new Error("Futures balance not available");
      }
      availableBalanceUsd = resolvedBalance.futures.marginAvailable;
    }

    logger.debug("Available balance determined", {
      instrumentType,
      availableBalanceUsd,
      balanceSource,
    });

    // ========== Step 4: Calculate Position Size ==========

    // Base position size: available balance * copy ratio
    let positionSizeUsd = availableBalanceUsd * copyRatio;
    let limitApplied: SafeQuantityResult["limitApplied"] = "copyRatio";

    logger.debug("Position size calculated", {
      positionSizeUsd,
      availableBalanceUsd,
      copyRatio,
    });

    // ========== Step 5: Apply Maximum Amount Cap ==========

    if (maxAmount) {
      const maxAmountNum =
        typeof maxAmount === "number" ? maxAmount : maxAmount.toNumber();

      if (positionSizeUsd > maxAmountNum) {
        logger.debug("Applying maxAmount cap", {
          originalSize: positionSizeUsd,
          cap: maxAmountNum,
        });

        positionSizeUsd = maxAmountNum;
        limitApplied = "maxAmount";

        warnings.push(
          `Position capped at $${maxAmountNum} (maxAmount limit applied)`,
        );
      }
    }

    // ========== Step 6: Check Sufficient Balance ==========

    if (positionSizeUsd > availableBalanceUsd) {
      logger.warn("Insufficient balance for calculated position size", {
        positionSizeUsd,
        availableBalanceUsd,
      });

      positionSizeUsd = availableBalanceUsd;
      limitApplied = "insufficientBalance";

      warnings.push(
        `Insufficient balance: using full available balance ($${availableBalanceUsd.toFixed(2)})`,
      );
    }

    // ========== Step 7: Convert to Quantity ==========

    // Calculate quantity in base asset
    let quantity = positionSizeUsd / entryPrice;

    logger.debug("Quantity calculated", {
      quantity,
      positionSizeUsd,
      entryPrice,
    });

    // ========== Step 8: Apply Exchange Minimums ==========

    const minimums = getExchangeMinimums(symbol);

    // Check minimum notional
    if (positionSizeUsd < minimums.minNotionalUsd) {
      logger.warn("Position size below minimum notional", {
        positionSizeUsd,
        minNotionalUsd: minimums.minNotionalUsd,
      });

      warnings.push(
        `Position size ($${positionSizeUsd.toFixed(2)}) below minimum ($${minimums.minNotionalUsd}). Trade will likely fail.`,
      );

      // Set to minimum
      positionSizeUsd = minimums.minNotionalUsd;
      quantity = positionSizeUsd / entryPrice;
      limitApplied = "exchangeMinimum";
    }

    // Check minimum quantity
    if (quantity < minimums.minQuantity) {
      logger.warn("Quantity below minimum", {
        quantity,
        minQuantity: minimums.minQuantity,
      });

      quantity = minimums.minQuantity;
      positionSizeUsd = quantity * entryPrice;
      limitApplied = "exchangeMinimum";

      warnings.push(
        `Quantity adjusted to exchange minimum (${minimums.minQuantity} ${symbol.replace("USDT", "").replace("USD", "")})`,
      );
    }

    // ========== Step 9: Round to Valid Precision ==========

    quantity = roundToValidPrecision(symbol, quantity);
    positionSizeUsd = quantity * entryPrice; // Recalculate after rounding

    logger.info("Safe quantity calculated", {
      userId,
      symbol,
      quantity,
      positionSizeUsd,
      availableBalanceUsd,
      limitApplied,
      warnings: warnings.length,
    });

    return {
      quantity,
      positionSizeUsd,
      availableBalanceUsd,
      limitApplied,
      warnings,
    };
  } catch (error) {
    logger.error("Failed to calculate safe quantity", {
      userId,
      symbol,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Validate if a quantity is safe for execution
 *
 * Quick validation without fetching balance.
 * Useful for pre-flight checks.
 *
 * @param symbol - Trading pair symbol
 * @param quantity - Quantity to validate
 * @param price - Price for notional calculation
 * @returns True if quantity meets minimums
 */
export function isQuantitySafe(
  symbol: string,
  quantity: number,
  price: number,
): boolean {
  const minimums = getExchangeMinimums(symbol);
  const notional = quantity * price;

  return (
    quantity >= minimums.minQuantity && notional >= minimums.minNotionalUsd
  );
}

/**
 * Get recommended position size based on balance
 *
 * Returns suggested position sizes for different risk levels.
 * Useful for UI to show users recommended allocations.
 *
 * @param availableBalanceUsd - User's available balance in USD
 * @param entryPrice - Entry price
 * @returns Suggested position sizes for different risk levels
 */
export function getRecommendedPositionSizes(
  availableBalanceUsd: number,
  entryPrice: number,
): {
  conservative: { copyRatio: number; quantity: number; usd: number };
  moderate: { copyRatio: number; quantity: number; usd: number };
  aggressive: { copyRatio: number; quantity: number; usd: number };
} {
  const conservative = {
    copyRatio: 0.05, // 5%
    usd: availableBalanceUsd * 0.05,
    quantity: (availableBalanceUsd * 0.05) / entryPrice,
  };

  const moderate = {
    copyRatio: 0.1, // 10%
    usd: availableBalanceUsd * 0.1,
    quantity: (availableBalanceUsd * 0.1) / entryPrice,
  };

  const aggressive = {
    copyRatio: 0.25, // 25%
    usd: availableBalanceUsd * 0.25,
    quantity: (availableBalanceUsd * 0.25) / entryPrice,
  };

  return { conservative, moderate, aggressive };
}
