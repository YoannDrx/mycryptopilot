import ccxt from "ccxt";
import { logger } from "@/lib/logger";
import type { TradeSide, OrderType } from "@/generated/prisma";
import type {
  ExchangeAdapter,
  PaginationOptions,
  FetchTradesResult,
} from "./exchange-service-factory";
import type {
  ConsolidatedBalance,
  PositionSnapshot,
  ConnectionStatus,
  RateLimitInfo,
  CreateOrderParams,
  OrderResult,
  CancelOrderParams,
  OrderStatus,
  NormalizedTrade,
} from "./types";

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

export class BybitService implements ExchangeAdapter {
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
   * Fetch account balance from Bybit
   *
   * @returns Promise<ccxt.Balances> - Account balance with total, free, and used amounts
   * @throws Error if fetch fails
   */
  async fetchBalance() {
    try {
      logger.info("Fetching Bybit balance");
      return await this.exchange.fetchBalance();
    } catch (error) {
      logger.error("Failed to fetch Bybit balance", { error });
      throw error;
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

  // ==========================================
  // ExchangeAdapter Interface Implementation
  // ==========================================

  /**
   * Fetch consolidated balance (spot + futures + margin)
   * @implements ExchangeAdapter.fetchConsolidatedBalance
   */
  async fetchConsolidatedBalance(): Promise<ConsolidatedBalance> {
    try {
      const timestamp = new Date();

      // Fetch spot balance
      const spotBalance = await this.exchange.fetchBalance();

      // Build spot assets
      const spotAssets: Record<
        string,
        {
          asset: string;
          free: number;
          locked: number;
          total: number;
          usdValue?: number;
        }
      > = {};
      const spotTotalUsd = 0;

      for (const [asset, data] of Object.entries(spotBalance)) {
        if (
          asset === "info" ||
          asset === "free" ||
          asset === "used" ||
          asset === "total" ||
          asset === "timestamp" ||
          asset === "datetime"
        ) {
          continue;
        }

        const balanceData = data as {
          free?: number;
          used?: number;
          total?: number;
        };
        if (balanceData.total && balanceData.total > 0) {
          spotAssets[asset] = {
            asset,
            free: balanceData.free ?? 0,
            locked: balanceData.used ?? 0,
            total: balanceData.total,
            usdValue: undefined, // TODO: Add price conversion
          };
        }
      }

      // Fetch futures balance if enabled
      let futuresBalance = null;
      try {
        const futuresData = await this.exchange.fetchBalance({
          type: "future",
        });
        const futuresAssets: Record<
          string,
          {
            asset: string;
            free: number;
            locked: number;
            total: number;
            usdValue?: number;
          }
        > = {};
        let futuresTotalUsd = 0;

        for (const [asset, data] of Object.entries(futuresData)) {
          if (
            asset === "info" ||
            asset === "free" ||
            asset === "used" ||
            asset === "total" ||
            asset === "timestamp" ||
            asset === "datetime"
          ) {
            continue;
          }

          const balanceData = data as {
            free?: number;
            used?: number;
            total?: number;
          };
          if (balanceData.total && balanceData.total > 0) {
            futuresAssets[asset] = {
              asset,
              free: balanceData.free ?? 0,
              locked: balanceData.used ?? 0,
              total: balanceData.total,
              usdValue: undefined,
            };
          }
        }

        // Extract Bybit futures-specific info
        const futuresInfo = futuresData.info as {
          totalWalletBalance?: string;
          totalMarginBalance?: string;
          totalUnrealizedProfit?: string;
          availableBalance?: string;
        };

        const totalWalletBalance = Number(
          futuresInfo.totalWalletBalance ?? "0",
        );
        const totalMarginBalance = Number(
          futuresInfo.totalMarginBalance ?? "0",
        );
        const unrealizedPnl = Number(futuresInfo.totalUnrealizedProfit ?? "0");
        const availableBalance = Number(futuresInfo.availableBalance ?? "0");

        futuresTotalUsd = totalWalletBalance;

        futuresBalance = {
          totalUsd: futuresTotalUsd,
          assets: futuresAssets,
          marginUsed: totalMarginBalance - availableBalance,
          marginAvailable: availableBalance,
          unrealizedPnl,
          leverage: null, // Not available at account level for Bybit
          raw: futuresData.info,
        };
      } catch (error) {
        logger.warn("Failed to fetch futures balance, skipping", { error });
      }

      // Fetch margin balance if enabled
      let marginBalance = null;
      try {
        const marginData = await this.exchange.fetchBalance({ type: "margin" });
        const marginAssets: Record<
          string,
          {
            asset: string;
            free: number;
            locked: number;
            total: number;
            usdValue?: number;
          }
        > = {};
        let marginTotalUsd = 0;

        for (const [asset, data] of Object.entries(marginData)) {
          if (
            asset === "info" ||
            asset === "free" ||
            asset === "used" ||
            asset === "total" ||
            asset === "timestamp" ||
            asset === "datetime"
          ) {
            continue;
          }

          const balanceData = data as {
            free?: number;
            used?: number;
            total?: number;
          };
          if (balanceData.total && balanceData.total > 0) {
            marginAssets[asset] = {
              asset,
              free: balanceData.free ?? 0,
              locked: balanceData.used ?? 0,
              total: balanceData.total,
              usdValue: undefined,
            };
          }
        }

        // Extract Bybit margin-specific info
        const marginInfo = marginData.info as {
          totalEquity?: string;
          totalLiability?: string;
        };

        const borrowed = Number(marginInfo.totalLiability ?? "0");
        marginTotalUsd = Number(marginInfo.totalEquity ?? "0");

        marginBalance = {
          totalUsd: marginTotalUsd,
          assets: marginAssets,
          borrowed,
          interest: 0, // Not directly available in balance endpoint
          raw: marginData.info,
        };
      } catch (error) {
        logger.warn("Failed to fetch margin balance, skipping", { error });
      }

      // Calculate total equity
      const totalEquityUsd =
        spotTotalUsd +
        (futuresBalance?.totalUsd ?? 0) +
        (marginBalance?.totalUsd ?? 0);

      const consolidatedBalance: ConsolidatedBalance = {
        timestamp,
        spot: {
          totalUsd: spotTotalUsd,
          assets: spotAssets,
          raw: spotBalance.info,
        },
        futures: futuresBalance ?? undefined,
        margin: marginBalance ?? undefined,
        totalEquityUsd,
      };

      return consolidatedBalance;
    } catch (error) {
      logger.error("Failed to fetch consolidated balance", { error });
      throw error;
    }
  }

  /**
   * Fetch open positions
   * @implements ExchangeAdapter.fetchOpenPositions
   */
  async fetchOpenPositions(): Promise<PositionSnapshot[]> {
    try {
      // CCXT fetchPositions() returns all open positions
      const ccxtPositions = await this.exchange.fetchPositions();

      // Filter out positions with zero amount (closed positions)
      const activePositions = ccxtPositions.filter(
        (pos) => pos.contracts && Number(pos.contracts) > 0,
      );

      // Convert to PositionSnapshot format
      const positions: PositionSnapshot[] = activePositions.map(
        (pos): PositionSnapshot => {
          const symbol = String(pos.symbol);
          const side = String(pos.side).toUpperCase() as "LONG" | "SHORT";
          const quantity = Number(pos.contracts ?? 0);
          const entryPrice = Number(pos.entryPrice ?? 0);
          const markPrice = Number(pos.markPrice ?? pos.entryPrice ?? 0);
          const leverage = pos.leverage ? Number(pos.leverage) : null;
          const margin = Number(pos.collateral ?? pos.initialMargin ?? 0);
          const unrealizedPnl = Number(pos.unrealizedPnl ?? 0);
          const liquidationPrice = pos.liquidationPrice
            ? Number(pos.liquidationPrice)
            : null;

          // Determine position type based on symbol and margin mode
          const marginMode = pos.marginMode as string | undefined;
          const type = this.determinePositionType(symbol, marginMode);

          const timestamp = pos.timestamp
            ? new Date(pos.timestamp)
            : new Date();

          return {
            symbol,
            side,
            quantity,
            entryPrice,
            markPrice,
            leverage,
            margin,
            unrealizedPnl,
            liquidationPrice,
            type,
            openedAt: timestamp,
            lastUpdatedAt: timestamp,
            metadata: {
              marginMode: marginMode ?? "unknown",
              notional: Number(pos.notional ?? 0),
              percentage: Number(pos.percentage ?? 0),
            },
            raw: pos.info as unknown,
          };
        },
      );

      logger.info("Fetched open positions", {
        count: positions.length,
      });

      return positions;
    } catch (error) {
      logger.error("Failed to fetch open positions", { error });
      throw error;
    }
  }

  /**
   * Fetch trades with pagination
   * @implements ExchangeAdapter.fetchTradesPaginated
   */
  async fetchTradesPaginated(
    symbol: string,
    options?: PaginationOptions,
  ): Promise<FetchTradesResult> {
    try {
      const limit = options?.limit ?? 500;
      const since = options?.since;

      // Fetch trades from ccxt
      const ccxtTrades = await this.exchange.fetchMyTrades(
        symbol,
        since,
        limit,
      );

      // Convert to NormalizedTrade format
      const trades: NormalizedTrade[] = ccxtTrades.map(
        (trade): NormalizedTrade => ({
          id: String(trade.id),
          orderId: String(trade.order),
          symbol: String(trade.symbol),
          side: trade.side === "buy" ? "BUY" : "SELL",
          type: this.mapTradeType(trade.type ?? "market"),
          quantity: Number(trade.amount),
          price: Number(trade.price),
          quoteQuantity: Number(trade.cost),
          fee: Number(trade.fee?.cost ?? 0),
          feeCurrency: trade.fee?.currency ?? "USDT",
          executedAt: new Date(trade.timestamp ?? Date.now()),
          instrumentType: "SPOT", // TODO: Detect futures
          realizedPnl: null,
          positionSide: null,
          raw: trade.info as unknown,
        }),
      );

      // Build cursor for pagination
      const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
      const cursor = {
        nextId: lastTrade ? lastTrade.id : null,
        nextTimestamp: lastTrade ? lastTrade.executedAt.getTime() : null,
        hasMore: trades.length === limit,
      };

      return { trades, cursor };
    } catch (error) {
      logger.error("Failed to fetch paginated trades", { error, symbol });
      throw error;
    }
  }

  /**
   * Test connection and return status
   * @implements ExchangeAdapter.testConnection
   */
  async testConnection(): Promise<ConnectionStatus> {
    const validation = await this.validateApiKeys();
    return {
      isValid: validation.isValid,
      isReadOnly: validation.isReadOnly,
      hasSpotEnabled: validation.hasSpotEnabled,
      hasFuturesEnabled: validation.hasFuturesEnabled,
      canTrade: !validation.isReadOnly,
      errorMessage: validation.errorMessage,
    };
  }

  /**
   * Get current rate limit info
   * @implements ExchangeAdapter.getRateLimitInfo
   */
  getRateLimitInfo(): RateLimitInfo | null {
    // ccxt doesn't expose rate limit info easily
    // This will be available when we migrate to native SDK
    logger.warn("getRateLimitInfo not available with ccxt");
    return null;
  }

  /**
   * Create order (for copy-trading)
   * @implements ExchangeAdapter.createOrder
   */
  async createOrder(_params: CreateOrderParams): Promise<OrderResult> {
    // TODO: Implement in Phase 3 (copy-trading)
    throw new Error("createOrder not yet implemented (Phase 3)");
  }

  /**
   * Cancel order
   * @implements ExchangeAdapter.cancelOrder
   */
  async cancelOrder(_params: CancelOrderParams): Promise<void> {
    // TODO: Implement in Phase 3 (copy-trading)
    throw new Error("cancelOrder not yet implemented (Phase 3)");
  }

  /**
   * Get order status
   * @implements ExchangeAdapter.getOrderStatus
   */
  async getOrderStatus(_params: CancelOrderParams): Promise<OrderStatus> {
    // TODO: Implement in Phase 3 (copy-trading)
    throw new Error("getOrderStatus not yet implemented (Phase 3)");
  }

  /**
   * Map ccxt trade type to NormalizedTrade type
   */
  private mapTradeType(
    ccxtType: string,
  ):
    | "MARKET"
    | "LIMIT"
    | "STOP"
    | "STOP_MARKET"
    | "STOP_LIMIT"
    | "TAKE_PROFIT"
    | "TAKE_PROFIT_MARKET"
    | "TRAILING_STOP" {
    switch (ccxtType.toLowerCase()) {
      case "market":
        return "MARKET";
      case "limit":
        return "LIMIT";
      case "stop":
      case "stop_loss":
        return "STOP";
      case "stop_market":
      case "stop_loss_market":
        return "STOP_MARKET";
      case "stop_limit":
      case "stop_loss_limit":
        return "STOP_LIMIT";
      case "take_profit":
        return "TAKE_PROFIT";
      case "take_profit_market":
        return "TAKE_PROFIT_MARKET";
      case "trailing_stop":
      case "trailing_stop_market":
        return "TRAILING_STOP";
      default:
        return "MARKET";
    }
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

  /**
   * Determine position type based on symbol and margin mode
   * Helper for fetchOpenPositions()
   */
  private determinePositionType(
    symbol: string,
    marginMode?: string,
  ):
    | "SPOT"
    | "MARGIN_CROSS"
    | "MARGIN_ISOLATED"
    | "FUTURES_USDT"
    | "FUTURES_COIN" {
    // Bybit futures symbols contain ":"
    // Examples:
    // - BTC/USDT:USDT -> USDT-margined futures (linear)
    // - BTC/USD:BTC -> Coin-margined futures (inverse)
    // - BTC/USDT -> Spot

    if (!symbol.includes(":")) {
      // Spot or margin
      if (marginMode === "cross") {
        return "MARGIN_CROSS";
      } else if (marginMode === "isolated") {
        return "MARGIN_ISOLATED";
      }
      return "SPOT";
    }

    // Futures: check settlement currency
    const parts = symbol.split(":");
    const settlementCurrency = parts[1];

    // USDT-margined futures (linear)
    if (settlementCurrency === "USDT" || settlementCurrency === "USDC") {
      return "FUTURES_USDT";
    }

    // Coin-margined futures (inverse)
    return "FUTURES_COIN";
  }
}
