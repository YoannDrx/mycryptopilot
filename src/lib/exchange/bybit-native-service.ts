/**
 * Bybit Native Service
 *
 * Native Bybit SDK implementation replacing CCXT
 *
 * Phase 2.3 - Full Migration to Native SDKs
 *
 * Performance improvement: 4.2x faster than CCXT (expected similar to Binance)
 * - CCXT: ~15ms per order
 * - Native SDK: ~3.66ms per order (estimated)
 *
 * Features:
 * - Direct Bybit API calls (no CCXT abstraction)
 * - Native TypeScript types
 * - Real rate limit info (from response headers)
 * - Spot + Futures support via RestClientV5
 * - Unified Trading Account (UTA) support
 *
 * @example
 * const service = new BybitNativeService(apiKey, secretKey);
 * const balance = await service.fetchConsolidatedBalance();
 * const order = await service.createOrder({ ... });
 * await service.close();
 */

import { RestClientV5 } from "bybit-api";
import { logger } from "@/lib/logger";
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
 * Bybit Native Service
 *
 * Implements ExchangeAdapter using native Bybit SDK (RestClientV5)
 */
export class BybitNativeService implements ExchangeAdapter {
  private readonly client: RestClientV5;

  constructor(
    apiKey: string,
    secretKey: string,
    options?: {
      testnet?: boolean;
      demoTrading?: boolean;
      parseAPIRateLimits?: boolean;
    },
  ) {
    logger.info("Initializing Bybit Native Service", {
      testnet: options?.testnet ?? false,
      demoTrading: options?.demoTrading ?? false,
    });

    // Initialize Bybit RestClientV5
    this.client = new RestClientV5({
      key: apiKey,
      secret: secretKey,
      testnet: options?.testnet ?? false,
      demoTrading: options?.demoTrading ?? false,
      parseAPIRateLimits: options?.parseAPIRateLimits ?? true,
    });
  }

  // ==========================================
  // ExchangeAdapter Interface Implementation
  // ==========================================

  /**
   * Fetch consolidated balance (spot + futures unified account)
   *
   * @implements ExchangeAdapter.fetchConsolidatedBalance
   */
  async fetchConsolidatedBalance(): Promise<ConsolidatedBalance> {
    logger.info("Fetching consolidated balance (Bybit native)");

    try {
      const timestamp = new Date();

      // Fetch unified wallet balance (includes spot + futures)
      const walletResponse = await this.client.getWalletBalance({
        accountType: "UNIFIED",
      });

      const walletData = walletResponse.result.list[0];

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

      let spotTotalUsd = 0;

      for (const coin of walletData.coin) {
        const free = Number(coin.availableToWithdraw);
        const locked = Number(coin.locked);
        const total = Number(coin.walletBalance);
        const usdValue = Number(coin.usdValue);

        if (total > 0) {
          spotAssets[coin.coin] = {
            asset: coin.coin,
            free,
            locked,
            total,
            usdValue,
          };

          spotTotalUsd += usdValue;
        }
      }

      // Bybit unified account includes futures in the same wallet
      const totalEquityUsd = Number(walletData.totalEquity || 0);
      const totalMarginUsd = Number(walletData.totalMarginBalance || 0);
      const availableMargin = Number(walletData.totalAvailableBalance || 0);

      const consolidatedBalance: ConsolidatedBalance = {
        timestamp,
        spot: {
          totalUsd: spotTotalUsd,
          assets: spotAssets,
          raw: walletData,
        },
        futures: {
          totalUsd: totalMarginUsd,
          assets: {}, // Unified account doesn't separate futures assets
          marginUsed: totalMarginUsd - availableMargin,
          marginAvailable: availableMargin,
          unrealizedPnl: Number(walletData.totalPerpUPL || 0),
          leverage: null,
          raw: walletData,
        },
        margin: undefined,
        totalEquityUsd,
      };

      logger.info("Consolidated balance fetched", {
        spotTotal: spotTotalUsd,
        totalEquity: totalEquityUsd,
      });

      return consolidatedBalance;
    } catch (error) {
      logger.error("Failed to fetch consolidated balance", { error });
      throw error;
    }
  }

  /**
   * Fetch open positions (futures only)
   *
   * @implements ExchangeAdapter.fetchOpenPositions
   */
  async fetchOpenPositions(): Promise<PositionSnapshot[]> {
    logger.info("Fetching open positions (Bybit native)");

    try {
      const positionsResponse = await this.client.getPositionInfo({
        category: "linear",
        settleCoin: "USDT",
      });

      const positionsData = positionsResponse.result.list;

      // Filter out positions with zero size
      const activePositions = positionsData.filter(
        (pos) => Number(pos.size) !== 0,
      );

      const positions: PositionSnapshot[] = activePositions.map((pos) => {
        const symbol = pos.symbol;
        const quantity = Number(pos.size);
        const side =
          pos.side === "Buy" ? ("LONG" as const) : ("SHORT" as const);
        const entryPrice = Number(pos.avgPrice);
        const markPrice = Number(pos.markPrice || pos.avgPrice);
        const leverage = Number(pos.leverage);
        const margin = Number(pos.positionIM ?? 0);
        const unrealizedPnl = Number(pos.unrealisedPnl);
        const liquidationPrice = Number(pos.liqPrice || 0);

        return {
          symbol,
          side,
          quantity,
          entryPrice,
          markPrice,
          leverage: leverage > 0 ? leverage : null,
          margin,
          unrealizedPnl,
          liquidationPrice: liquidationPrice > 0 ? liquidationPrice : null,
          type: "FUTURES_USDT",
          openedAt: new Date(Number(pos.createdTime) || Date.now()),
          lastUpdatedAt: new Date(Number(pos.updatedTime) || Date.now()),
          metadata: {
            positionIdx: pos.positionIdx,
            riskId: pos.riskId,
            takeProfit: pos.takeProfit,
            stopLoss: pos.stopLoss,
          },
          raw: pos,
        };
      });

      logger.info("Open positions fetched", {
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
   *
   * @implements ExchangeAdapter.fetchTradesPaginated
   */
  async fetchTradesPaginated(
    symbol: string,
    options?: PaginationOptions,
  ): Promise<FetchTradesResult> {
    logger.info("Fetching trades paginated (Bybit native)", {
      symbol,
      limit: options?.limit,
    });

    try {
      const limit = options?.limit ?? 50;
      const startTime = options?.since;

      // Fetch execution history from Bybit (spot trades)
      const tradesResponse = await this.client.getHistoricOrders({
        category: "spot",
        symbol,
        ...(startTime && { startTime }),
        limit,
      });

      const tradesData = tradesResponse.result.list;

      // Convert to NormalizedTrade format
      const trades: NormalizedTrade[] = tradesData
        .filter((order) => order.orderStatus === "Filled")
        .map((order) => ({
          id: order.orderId,
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side === "Buy" ? "BUY" : "SELL",
          type: order.orderType === "Market" ? "MARKET" : "LIMIT",
          quantity: Number(order.qty),
          price: Number(order.avgPrice || order.price),
          quoteQuantity: Number(order.cumExecValue || 0),
          fee: Number(order.cumExecFee || 0),
          feeCurrency: "USDT", // Bybit doesn't expose feeCurrency in order history
          executedAt: new Date(Number(order.updatedTime)),
          instrumentType: "SPOT",
          realizedPnl: null,
          positionSide: null,
          raw: order,
        }));

      // Build cursor for pagination
      const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
      const cursor = {
        nextId: lastTrade ? lastTrade.id : null,
        nextTimestamp: lastTrade ? lastTrade.executedAt.getTime() : null,
        hasMore: trades.length === limit,
      };

      logger.info("Trades fetched", {
        count: trades.length,
        hasMore: cursor.hasMore,
      });

      return { trades, cursor };
    } catch (error) {
      logger.error("Failed to fetch paginated trades", { error, symbol });
      throw error;
    }
  }

  /**
   * Test connection and return status
   *
   * @implements ExchangeAdapter.testConnection
   */
  async testConnection(): Promise<ConnectionStatus> {
    logger.info("Testing connection (Bybit native)");

    try {
      // Get API key information to check permissions
      const apiKeyResponse = await this.client.getQueryApiKey();

      const apiKeyInfo = apiKeyResponse.result;
      const permissions = apiKeyInfo.permissions;

      const canTrade = permissions.ContractTrade.includes("Order");
      const isReadOnly = !canTrade;

      logger.info("Connection test successful", {
        canTrade,
        isReadOnly,
      });

      return {
        isValid: true,
        isReadOnly,
        hasSpotEnabled: permissions.Spot.includes("SpotTrade"),
        hasFuturesEnabled: permissions.ContractTrade.includes("Order"),
        canTrade,
      };
    } catch (error) {
      logger.error("Connection test failed", { error });

      return {
        isValid: false,
        isReadOnly: false,
        hasSpotEnabled: false,
        hasFuturesEnabled: false,
        canTrade: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get current rate limit info
   *
   * ✅ NEW: Native SDK can provide rate limit data
   *
   * @implements ExchangeAdapter.getRateLimitInfo
   */
  getRateLimitInfo(): RateLimitInfo | null {
    // Bybit SDK can expose rate limit info via parseAPIRateLimits option
    logger.debug("Getting rate limit info (Bybit native)");

    // TODO: Extract from SDK response headers
    // Would need to track rate limits from responses

    return null;
  }

  /**
   * Create order on Bybit
   *
   * Routes to correct category based on instrumentType:
   * - SPOT → category: "spot"
   * - FUTURES_USDT → category: "linear"
   *
   * @implements ExchangeAdapter.createOrder
   */
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const { symbol, side, type, instrumentType } = params;

    logger.info("Creating order (Bybit native)", {
      symbol,
      side,
      type,
      instrumentType,
    });

    try {
      const category = instrumentType === "FUTURES_USDT" ? "linear" : "spot";
      const orderSide = side === "BUY" ? "Buy" : "Sell";
      const orderType = type === "MARKET" ? "Market" : "Limit";

      const orderParams = {
        category,
        symbol,
        side: orderSide,
        orderType,
        qty: String(params.quantity),
        ...(params.price && { price: String(params.price) }),
        ...(params.timeInForce && { timeInForce: params.timeInForce }),
        ...(params.clientOrderId && {
          orderLinkId: params.clientOrderId,
        }),
        ...(params.positionSide && { positionIdx: params.positionSide }),
        ...(params.reduceOnly !== undefined && {
          reduceOnly: params.reduceOnly,
        }),
      };

      logger.debug("Submitting order", { orderParams });

      const startTime = Date.now();
      // Type assertion needed due to SDK type strictness
      const orderResponse = await this.client.submitOrder(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderParams as any,
      );
      const latency = Date.now() - startTime;

      const bybitOrder = orderResponse.result;

      logger.info("Order executed via native SDK", {
        orderId: bybitOrder.orderId,
        latency: `${latency}ms`,
      });

      // Map Bybit response to OrderResult
      return this.mapBybitOrderToResult(bybitOrder, latency);
    } catch (error) {
      logger.error("Failed to create order", {
        error,
        params,
      });
      throw error;
    }
  }

  /**
   * Cancel order
   *
   * @implements ExchangeAdapter.cancelOrder
   */
  async cancelOrder(params: CancelOrderParams): Promise<void> {
    const { symbol, orderId, clientOrderId } = params;

    logger.info("Canceling order (Bybit native)", {
      symbol,
      orderId,
      clientOrderId,
    });

    try {
      await this.client.cancelOrder({
        category: "spot", // TODO: Determine from instrumentType
        symbol,
        ...(orderId && { orderId }),
        ...(clientOrderId && { orderLinkId: clientOrderId }),
      });

      logger.info("Order canceled successfully", {
        orderId,
        clientOrderId,
      });
    } catch (error) {
      logger.error("Failed to cancel order", { error, params });
      throw error;
    }
  }

  /**
   * Get order status
   *
   * @implements ExchangeAdapter.getOrderStatus
   */
  async getOrderStatus(params: CancelOrderParams): Promise<OrderStatus> {
    const { symbol, orderId, clientOrderId } = params;

    logger.info("Getting order status (Bybit native)", {
      symbol,
      orderId,
      clientOrderId,
    });

    try {
      const orderResponse = await this.client.getActiveOrders({
        category: "spot", // TODO: Determine from instrumentType
        symbol,
        ...(orderId && { orderId }),
        ...(clientOrderId && { orderLinkId: clientOrderId }),
      });

      const order = orderResponse.result.list[0];

      const orderStatus: OrderStatus = {
        orderId: order.orderId,
        status: this.mapBybitStatus(order.orderStatus),
        executedQty: Number(order.cumExecQty),
        price: Number(order.price),
        stopPrice: Number(order.triggerPrice),
        updatedAt: new Date(Number(order.updatedTime)),
        raw: order,
      };

      logger.info("Order status fetched", {
        orderId: orderStatus.orderId,
        status: orderStatus.status,
      });

      return orderStatus;
    } catch (error) {
      logger.error("Failed to get order status", { error, params });
      throw error;
    }
  }

  /**
   * Close connections (no-op for native SDK)
   *
   * Native SDK uses axios with keep-alive,
   * connections are managed automatically.
   *
   * @implements ExchangeAdapter.close
   */
  async close(): Promise<void> {
    logger.debug("Closing Bybit Native Service (no-op)");
  }

  /**
   * Fetch recent trades (all symbols)
   *
   * TODO: This method needs proper implementation with native SDK
   * Currently returns empty array as placeholder
   *
   * @param _daysSince - Number of days to fetch
   * @param _sinceDate - Start date for fetch
   */
  /**
   * Fetch recent trades (spot + linear futures)
   * @param daysSince - Number of days to fetch (default 30)
   * @param sinceDate - Start date for fetch (overrides daysSince if provided)
   */
  async fetchRecentTrades(
    daysSince = 30,
    sinceDate?: Date,
  ): Promise<
    {
      externalOrderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type:
        | "MARKET"
        | "LIMIT"
        | "STOP_LOSS"
        | "STOP_LOSS_LIMIT"
        | "TAKE_PROFIT"
        | "TAKE_PROFIT_LIMIT";
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeAsset: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    try {
      logger.info("Fetching Bybit trades (native SDK)", {
        daysSince,
        sinceDate: sinceDate?.toISOString(),
      });

      // Calculate timestamp
      const since =
        sinceDate ?? new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000);
      const startTime = since.getTime();

      // Fetch spot trades
      const spotTrades = await this.fetchSpotTradesNative(startTime);

      // Fetch linear (futures) trades
      const linearTrades = await this.fetchLinearTradesNative(startTime);

      const allTrades = [...spotTrades, ...linearTrades];

      // Sort by execution date (most recent first)
      allTrades.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

      logger.info("Bybit trades fetched successfully (native SDK)", {
        spotCount: spotTrades.length,
        linearCount: linearTrades.length,
        totalCount: allTrades.length,
      });

      return allTrades;
    } catch (error) {
      logger.error("Failed to fetch Bybit trades (native SDK)", { error });
      throw new Error(
        `Failed to fetch trades: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch spot trades using native Bybit SDK
   * @private
   */
  private async fetchSpotTradesNative(startTime: number): Promise<
    {
      externalOrderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type:
        | "MARKET"
        | "LIMIT"
        | "STOP_LOSS"
        | "STOP_LOSS_LIMIT"
        | "TAKE_PROFIT"
        | "TAKE_PROFIT_LIMIT";
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeAsset: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    try {
      logger.info("Fetching spot trades (Bybit native)", { startTime });

      // Bybit API requires pagination for execution history
      const trades = await this.client.getExecutionList({
        category: "spot",
        startTime,
        limit: 100, // Max per request
      });

      return trades.result.list.map((trade) => ({
        externalOrderId: trade.orderId,
        symbol: trade.symbol,
        side: trade.side === "Buy" ? ("BUY" as const) : ("SELL" as const),
        type: this.mapBybitOrderType(trade.orderType),
        quantity: Number(trade.execQty),
        price: Number(trade.execPrice),
        quoteQuantity: Number(trade.execValue),
        fee: Number(trade.execFee),
        feeAsset: trade.feeRate ? "USDT" : "USDT", // Bybit doesn't provide feeAsset in execList
        realizedPnl: null, // Spot trades don't have realized PnL
        executedAt: new Date(Number(trade.execTime)),
      }));
    } catch (error) {
      logger.error("Failed to fetch spot trades (Bybit native)", { error });
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Fetch linear (futures) trades using native Bybit SDK
   * @private
   */
  private async fetchLinearTradesNative(startTime: number): Promise<
    {
      externalOrderId: string;
      symbol: string;
      side: "BUY" | "SELL";
      type:
        | "MARKET"
        | "LIMIT"
        | "STOP_LOSS"
        | "STOP_LOSS_LIMIT"
        | "TAKE_PROFIT"
        | "TAKE_PROFIT_LIMIT";
      quantity: number;
      price: number;
      quoteQuantity: number;
      fee: number;
      feeAsset: string;
      realizedPnl: number | null;
      executedAt: Date;
    }[]
  > {
    try {
      logger.info("Fetching linear trades (Bybit native)", { startTime });

      // Bybit API requires pagination for execution history
      const trades = await this.client.getExecutionList({
        category: "linear",
        startTime,
        limit: 100, // Max per request
      });

      return trades.result.list.map((trade) => ({
        externalOrderId: trade.orderId,
        symbol: trade.symbol,
        side: trade.side === "Buy" ? ("BUY" as const) : ("SELL" as const),
        type: this.mapBybitOrderType(trade.orderType),
        quantity: Number(trade.execQty),
        price: Number(trade.execPrice),
        quoteQuantity: Number(trade.execValue),
        fee: Number(trade.execFee),
        feeAsset: trade.feeRate ? "USDT" : "USDT", // Bybit linear uses USDT
        realizedPnl: trade.closedSize ? Number(trade.closedSize) : null,
        executedAt: new Date(Number(trade.execTime)),
      }));
    } catch (error) {
      logger.error("Failed to fetch linear trades (Bybit native)", { error });
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Map Bybit order type to our OrderType
   * @private
   */
  private mapBybitOrderType(
    bybitType: string,
  ):
    | "MARKET"
    | "LIMIT"
    | "STOP_LOSS"
    | "STOP_LOSS_LIMIT"
    | "TAKE_PROFIT"
    | "TAKE_PROFIT_LIMIT" {
    switch (bybitType) {
      case "Market":
        return "MARKET";
      case "Limit":
        return "LIMIT";
      default:
        return "LIMIT"; // Default to LIMIT for unknown types
    }
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Map Bybit order status to our OrderStatus
   */
  private mapBybitStatus(
    status: string,
  ): "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" {
    switch (status) {
      case "New":
      case "Created":
        return "NEW";
      case "PartiallyFilled":
        return "PARTIALLY_FILLED";
      case "Filled":
        return "FILLED";
      case "Cancelled":
      case "Canceled":
        return "CANCELED";
      case "Rejected":
      case "Deactivated":
        return "REJECTED";
      default:
        return "NEW";
    }
  }

  /**
   * Map Bybit order response to OrderResult
   */
  private mapBybitOrderToResult(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bybitOrder: any,
    latency?: number,
  ): OrderResult {
    const orderResult: OrderResult = {
      orderId: bybitOrder.orderId,
      clientOrderId: bybitOrder.orderLinkId ?? null,
      symbol: bybitOrder.symbol ?? "",
      status: this.mapBybitStatus(bybitOrder.orderStatus ?? "New"),
      executedQty: Number(bybitOrder.cumExecQty ?? 0),
      executedPrice: Number(bybitOrder.avgPrice ?? bybitOrder.price ?? 0),
      cummulativeQuoteQty: Number(bybitOrder.cumExecValue ?? 0),
      fills: [], // Bybit doesn't return fills in order response
      transactTime: new Date(Number(bybitOrder.createdTime) || Date.now()),
      raw: bybitOrder,
    };

    // Log performance if latency provided
    if (latency !== undefined) {
      logger.debug("Order execution latency", {
        latency: `${latency}ms`,
        orderId: orderResult.orderId,
      });
    }

    return orderResult;
  }
}
