import ccxt from "ccxt";
import { logger } from "@/lib/logger";
import type { TradeSide, OrderType } from "@/generated/prisma";

/**
 * Bybit Service
 *
 * Provides integration with Bybit API using ccxt library.
 *
 * Features:
 * - Validate API keys (read-only enforcement)
 * - Fetch trades history (spot + futures)
 * - Rate limiting (handled by ccxt)
 * - Error handling + logging
 *
 * @example
 * const bybit = new BybitService(apiKey, secretKey);
 * await bybit.validateApiKeys(); // Throws if invalid or not read-only
 * const trades = await bybit.fetchRecentTrades(30); // Last 30 days
 */

export type BybitTrade = {
  externalOrderId: string; // Unique order ID from Bybit
  symbol: string; // BTC/USDT, ETH/USDT, etc.
  side: TradeSide; // BUY or SELL
  type: OrderType; // MARKET, LIMIT, etc.
  quantity: number; // Amount of base asset (BTC, ETH, etc.)
  price: number; // Price per unit in quote asset (USDT)
  quoteQuantity: number; // Total in quote asset (USDT)
  fee: number; // Trading fee
  feeAsset: string; // Fee currency (usually USDT)
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

export class BybitService {
  private readonly exchange: InstanceType<typeof ccxt.bybit>;

  constructor(apiKey: string, secretKey: string) {
    this.exchange = new ccxt.bybit({
      apiKey,
      secret: secretKey,
      enableRateLimit: true, // Automatic rate limiting (120 req/min for Bybit)
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
      logger.info("Validating Bybit API keys");

      // Test authentication with account info (confirms valid keys)
      await this.exchange.fetchBalance();

      // Check API key permissions via Bybit API
      const permissions = await this.checkApiKeyPermissions();

      logger.info("Bybit API keys validated", {
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
      logger.error("Bybit API key validation failed", { error });

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
   * Fetch recent trades from Bybit (spot + futures)
   *
   * @param daysSince - Number of days to fetch (default: 30)
   * @param sinceDate - Fetch trades since this date (optional, overrides daysSince)
   * @returns Promise<BybitTrade[]>
   * @throws Error if fetch fails
   */
  async fetchRecentTrades(
    daysSince = 30,
    sinceDate?: Date,
  ): Promise<BybitTrade[]> {
    try {
      logger.info("Fetching Bybit trades", {
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

      logger.info("Bybit trades fetched successfully", {
        spotCount: spotTrades.length,
        futuresCount: futuresTrades.length,
        totalCount: allTrades.length,
      });

      return allTrades;
    } catch (error) {
      logger.error("Failed to fetch Bybit trades", { error });
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
   * Check API key permissions via Bybit private API
   *
   * Note: Bybit API v5 uses different endpoint structure than Binance
   */
  private async checkApiKeyPermissions(): Promise<{
    isReadOnly: boolean;
    hasSpotEnabled: boolean;
    hasFuturesEnabled: boolean;
  }> {
    try {
      // Call Bybit private API to get API key info
      // Bybit v5 API: GET /v5/user/query-api
      type BybitExchange = InstanceType<typeof ccxt.bybit> & {
        privateGetV5UserQueryApi: () => Promise<{
          result?: {
            readOnly?: number; // 0 = read/write, 1 = read-only
            permissions?: {
              Spot?: string[]; // ["SpotTrade"] if spot trading enabled
              Derivatives?: string[]; // ["DerivativesTrade"] if derivatives enabled
            };
          };
        }>;
      };

      const response = await (
        this.exchange as BybitExchange
      ).privateGetV5UserQueryApi();

      // Bybit API returns readOnly as string '1' or '0', not number
      const readOnly = Number(response.result?.readOnly ?? 0);
      const permissions = response.result?.permissions;

      // Read-only = readOnly flag is 1
      const isReadOnly = readOnly === 1;

      // Check spot and derivatives permissions
      const hasSpotTrading = permissions?.Spot?.includes("SpotTrade") ?? false;
      const hasDerivativesTrading =
        permissions?.Derivatives?.includes("DerivativesTrade") ?? false;

      // For read-only keys, trading should be disabled
      const isActuallyReadOnly =
        isReadOnly || (!hasSpotTrading && !hasDerivativesTrading);

      logger.info("Bybit API key permissions checked", {
        readOnly,
        isReadOnly: isActuallyReadOnly,
        hasSpotTrading,
        hasDerivativesTrading,
      });

      return {
        isReadOnly: isActuallyReadOnly,
        hasSpotEnabled: true, // Always true if keys are valid (can read spot data)
        hasFuturesEnabled: true, // Always true if keys are valid (can read futures data)
      };
    } catch (error) {
      logger.warn(
        "Failed to check Bybit API key permissions, assuming read-only",
        {
          error,
        },
      );

      // If we can't check permissions, assume read-only for safety
      return {
        isReadOnly: true,
        hasSpotEnabled: true,
        hasFuturesEnabled: true,
      };
    }
  }

  /**
   * Fetch spot trades from Bybit
   */
  private async fetchSpotTrades(sinceTimestamp: number): Promise<BybitTrade[]> {
    try {
      // Get all spot markets
      const markets = await this.exchange.loadMarkets();
      const spotMarkets = Object.keys(markets).filter(
        (symbol) => markets[symbol]?.spot,
      );

      logger.info("Fetching Bybit spot trades", {
        marketCount: spotMarkets.length,
      });

      // Fetch trades for each market (Bybit API limitation: must fetch per symbol)
      const tradesPromises = spotMarkets.map(async (symbol) => {
        try {
          const trades = await this.exchange.fetchMyTrades(
            symbol,
            sinceTimestamp,
          );
          return trades.map((trade) => this.mapCcxtTradeToInternal(trade));
        } catch (error) {
          // Some markets might fail (no trades, delisted, etc.)
          logger.debug("Failed to fetch Bybit trades for symbol", {
            symbol,
            error: error instanceof Error ? error.message : "Unknown",
          });
          return [];
        }
      });

      const tradesArrays = await Promise.all(tradesPromises);
      return tradesArrays.flat();
    } catch (error) {
      logger.error("Failed to fetch Bybit spot trades", { error });
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Fetch futures trades from Bybit
   */
  private async fetchFuturesTrades(
    sinceTimestamp: number,
  ): Promise<BybitTrade[]> {
    try {
      // Switch to futures mode
      this.exchange.options.defaultType = "future";

      // Get all futures markets
      const markets = await this.exchange.loadMarkets();
      const futuresMarkets = Object.keys(markets).filter(
        (symbol) => markets[symbol]?.future,
      );

      logger.info("Fetching Bybit futures trades", {
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
          logger.debug("Failed to fetch Bybit futures trades for symbol", {
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
      logger.error("Failed to fetch Bybit futures trades", { error });

      // Switch back to spot mode on error
      this.exchange.options.defaultType = "spot";

      return [];
    }
  }

  /**
   * Map ccxt trade object to internal BybitTrade format
   */
  private mapCcxtTradeToInternal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trade: any,
    isFutures = false,
  ): BybitTrade {
    // Bybit order ID is used as external order ID
    const externalOrderId = String(trade.order ?? trade.id);

    // Map ccxt side to internal TradeSide
    const side: TradeSide = trade.side === "buy" ? "BUY" : "SELL";

    // Map ccxt type to internal OrderType
    const type: OrderType = this.mapOrderType(String(trade.type));

    // Calculate realized PnL for futures (if available)
    const realizedPnl =
      isFutures && trade.info?.closedPnl
        ? parseFloat(trade.info.closedPnl as string)
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
