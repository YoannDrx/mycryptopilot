import ccxt from "ccxt";
import { logger } from "@/lib/logger";
import type { TradeSide, OrderType } from "@/generated/prisma";

/**
 * Binance Service
 *
 * Provides integration with Binance API using ccxt library.
 *
 * Features:
 * - Validate API keys (read-only enforcement)
 * - Fetch trades history (spot + futures)
 * - Rate limiting (handled by ccxt)
 * - Error handling + logging
 *
 * @example
 * const binance = new BinanceService(apiKey, secretKey);
 * await binance.validateApiKeys(); // Throws if invalid or not read-only
 * const trades = await binance.fetchRecentTrades(30); // Last 30 days
 */

export type BinanceTrade = {
  externalOrderId: string; // Unique order ID from Binance
  symbol: string; // BTC/USDT, ETH/USDT, etc.
  side: TradeSide; // BUY or SELL
  type: OrderType; // MARKET, LIMIT, etc.
  quantity: number; // Amount of base asset (BTC, ETH, etc.)
  price: number; // Price per unit in quote asset (USDT)
  quoteQuantity: number; // Total in quote asset (USDT)
  fee: number; // Trading fee
  feeAsset: string; // Fee currency (usually BNB or USDT)
  realizedPnl: number | null; // For futures only
  executedAt: Date; // Trade execution timestamp
};

type ValidationResult = {
  isValid: boolean;
  isReadOnly: boolean;
  hasSpotEnabled: boolean;
  hasFuturesEnabled: boolean;
  errorMessage?: string;
};

export class BinanceService {
  private readonly exchange: InstanceType<typeof ccxt.binance>;

  constructor(apiKey: string, secretKey: string) {
    this.exchange = new ccxt.binance({
      apiKey,
      secret: secretKey,
      enableRateLimit: true, // Automatic rate limiting
      options: {
        defaultType: "spot", // Default to spot trading
      },
    });
  }

  /**
   * Validate API keys and check permissions
   *
   * Checks:
   * 1. Keys are valid (can authenticate)
   * 2. Keys are read-only (no trading permissions)
   * 3. Spot trading enabled
   * 4. Futures trading enabled (optional)
   *
   * @returns Promise<ValidationResult>
   * @throws Error if validation fails
   */
  async validateApiKeys(): Promise<ValidationResult> {
    try {
      logger.info("Validating Binance API keys");

      // Test authentication with account info (confirms valid keys)
      await this.exchange.fetchBalance();

      // Binance API doesn't directly expose permissions in fetchBalance
      // We need to check account permissions via private API
      const permissions = await this.checkApiKeyPermissions();

      logger.info("Binance API keys validated", {
        isValid: true,
        isReadOnly: permissions.isReadOnly,
        hasSpot: permissions.hasSpotEnabled,
        hasFutures: permissions.hasFuturesEnabled,
      });

      return {
        isValid: true,
        ...permissions,
      };
    } catch (error) {
      logger.error("Binance API key validation failed", { error });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Detect common error types
      if (
        errorMessage.includes("Invalid API-key") ||
        errorMessage.includes("401")
      ) {
        return {
          isValid: false,
          isReadOnly: false,
          hasSpotEnabled: false,
          hasFuturesEnabled: false,
          errorMessage: "Invalid API keys",
        };
      }

      if (errorMessage.includes("IP address")) {
        return {
          isValid: false,
          isReadOnly: false,
          hasSpotEnabled: false,
          hasFuturesEnabled: false,
          errorMessage: "IP address not whitelisted",
        };
      }

      return {
        isValid: false,
        isReadOnly: false,
        hasSpotEnabled: false,
        hasFuturesEnabled: false,
        errorMessage,
      };
    }
  }

  /**
   * Fetch recent trades from Binance (spot + futures)
   *
   * @param daysSince - Number of days to fetch (default: 30)
   * @param sinceDate - Fetch trades since this date (optional, overrides daysSince)
   * @returns Promise<BinanceTrade[]>
   * @throws Error if fetch fails
   */
  async fetchRecentTrades(
    daysSince = 30,
    sinceDate?: Date,
  ): Promise<BinanceTrade[]> {
    try {
      logger.info("Fetching Binance trades", {
        daysSince,
        sinceDate: sinceDate?.toISOString(),
      });

      const since =
        sinceDate ?? new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000);
      const sinceTimestamp = since.getTime();

      // Fetch spot trades
      const spotTrades = await this.fetchSpotTrades(sinceTimestamp);

      // Fetch futures trades (if enabled)
      const futuresTrades = await this.fetchFuturesTrades(sinceTimestamp);

      const allTrades = [...spotTrades, ...futuresTrades];

      // Sort by execution date (most recent first)
      allTrades.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

      logger.info("Binance trades fetched successfully", {
        spotCount: spotTrades.length,
        futuresCount: futuresTrades.length,
        totalCount: allTrades.length,
      });

      return allTrades;
    } catch (error) {
      logger.error("Failed to fetch Binance trades", { error });
      throw new Error(
        `Failed to fetch trades: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Close exchange connection
   */
  async close(): Promise<void> {
    await this.exchange.close();
  }

  /**
   * Check API key permissions via Binance private API
   *
   * WARNING: This is a private method that calls Binance's account/apiRestrictions endpoint
   */
  private async checkApiKeyPermissions(): Promise<{
    isReadOnly: boolean;
    hasSpotEnabled: boolean;
    hasFuturesEnabled: boolean;
  }> {
    try {
      // Call Binance private API to get API key restrictions
      type BinanceExchange = InstanceType<typeof ccxt.binance> & {
        sapiGetAccountApiRestrictions: () => Promise<{
          enableSpotAndMarginTrading?: boolean;
          enableFutures?: boolean;
          enableWithdrawals?: boolean;
        }>;
      };

      const restrictions = await (
        this.exchange as BinanceExchange
      ).sapiGetAccountApiRestrictions();

      const enableSpotAndMarginTrading =
        restrictions.enableSpotAndMarginTrading ?? false;
      const enableFutures = restrictions.enableFutures ?? false;
      const enableWithdrawals = restrictions.enableWithdrawals ?? false;

      // Read-only = no spot trading, no futures, no withdrawals
      const isReadOnly =
        !enableSpotAndMarginTrading && !enableFutures && !enableWithdrawals;

      return {
        isReadOnly,
        hasSpotEnabled: true, // Always true if keys are valid (can read spot data)
        hasFuturesEnabled: enableFutures,
      };
    } catch (error) {
      logger.warn("Failed to check API key permissions, assuming read-only", {
        error,
      });

      // If we can't check permissions, assume read-only for safety
      return {
        isReadOnly: true,
        hasSpotEnabled: true,
        hasFuturesEnabled: false,
      };
    }
  }

  /**
   * Fetch spot trades from Binance
   */
  private async fetchSpotTrades(
    sinceTimestamp: number,
  ): Promise<BinanceTrade[]> {
    try {
      // Get all spot markets
      const markets = await this.exchange.loadMarkets();
      const spotMarkets = Object.keys(markets).filter(
        (symbol) => markets[symbol]?.spot,
      );

      logger.info("Fetching spot trades", { marketCount: spotMarkets.length });

      // Fetch trades for each market (Binance API limitation: must fetch per symbol)
      const tradesPromises = spotMarkets.map(async (symbol) => {
        try {
          const trades = await this.exchange.fetchMyTrades(
            symbol,
            sinceTimestamp,
          );
          return trades.map((trade) => this.mapCcxtTradeToInternal(trade));
        } catch (error) {
          // Some markets might fail (no trades, delisted, etc.)
          logger.debug("Failed to fetch trades for symbol", {
            symbol,
            error: error instanceof Error ? error.message : "Unknown",
          });
          return [];
        }
      });

      const tradesArrays = await Promise.all(tradesPromises);
      return tradesArrays.flat();
    } catch (error) {
      logger.error("Failed to fetch spot trades", { error });
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Fetch futures trades from Binance
   */
  private async fetchFuturesTrades(
    sinceTimestamp: number,
  ): Promise<BinanceTrade[]> {
    try {
      // Switch to futures mode
      this.exchange.options.defaultType = "future";

      // Get all futures markets
      const markets = await this.exchange.loadMarkets();
      const futuresMarkets = Object.keys(markets).filter(
        (symbol) => markets[symbol]?.future,
      );

      logger.info("Fetching futures trades", {
        marketCount: futuresMarkets.length,
      });

      // Fetch trades for each market
      const tradesPromises = futuresMarkets.map(async (symbol) => {
        try {
          const trades = await this.exchange.fetchMyTrades(
            symbol,
            sinceTimestamp,
          );
          return trades.map((trade) =>
            this.mapCcxtTradeToInternal(trade, true),
          );
        } catch (error) {
          logger.debug("Failed to fetch futures trades for symbol", {
            symbol,
            error: error instanceof Error ? error.message : "Unknown",
          });
          return [];
        }
      });

      const tradesArrays = await Promise.all(tradesPromises);

      // Switch back to spot mode
      this.exchange.options.defaultType = "spot";

      return tradesArrays.flat();
    } catch (error) {
      logger.error("Failed to fetch futures trades", { error });

      // Switch back to spot mode on error
      this.exchange.options.defaultType = "spot";

      return [];
    }
  }

  /**
   * Map ccxt trade object to internal BinanceTrade format
   */
  private mapCcxtTradeToInternal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trade: any,
    isFutures = false,
  ): BinanceTrade {
    // Binance order ID is used as external order ID
    const externalOrderId = String(trade.order ?? trade.id);

    // Map ccxt side to internal TradeSide
    const side: TradeSide = trade.side === "buy" ? "BUY" : "SELL";

    // Map ccxt type to internal OrderType
    const type: OrderType = this.mapOrderType(String(trade.type));

    // Calculate realized PnL for futures (if available)
    const realizedPnl =
      isFutures && trade.info?.realizedPnl
        ? parseFloat(trade.info.realizedPnl as string)
        : null;

    return {
      externalOrderId,
      symbol: String(trade.symbol),
      side,
      type,
      quantity: Number(trade.amount),
      price: Number(trade.price),
      quoteQuantity: Number(trade.cost),
      fee: Number(trade.fee?.cost ?? 0),
      feeAsset: String(trade.fee?.currency ?? "USDT"),
      realizedPnl,
      executedAt: new Date(Number(trade.timestamp)),
    };
  }

  /**
   * Map ccxt order type to internal OrderType
   */
  private mapOrderType(ccxtType: string): OrderType {
    switch (ccxtType.toLowerCase()) {
      case "market":
        return "MARKET";
      case "limit":
        return "LIMIT";
      case "stop_loss":
      case "stop":
        return "STOP_LOSS";
      case "stop_loss_limit":
        return "STOP_LOSS_LIMIT";
      case "take_profit":
        return "TAKE_PROFIT";
      case "take_profit_limit":
        return "TAKE_PROFIT_LIMIT";
      default:
        return "MARKET"; // Default fallback
    }
  }
}
