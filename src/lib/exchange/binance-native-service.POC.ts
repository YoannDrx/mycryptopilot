/**
 * Binance Native Service POC
 *
 * Proof of Concept for Phase 2.3 - Native SDK Migration
 *
 * This POC implements ONLY createOrder() to validate performance gains
 * before full migration from CCXT to native Binance SDK.
 *
 * Expected Performance:
 * - CCXT: ~15ms per order
 * - Native SDK: ~3ms per order
 * - Improvement: 5x faster ✅
 *
 * Usage:
 * ```typescript
 * import { BinanceNativeServicePOC } from './binance-native-service.POC';
 *
 * const service = new BinanceNativeServicePOC(apiKey, secretKey);
 * const order = await service.createOrder({
 *   symbol: 'BTCUSDT',
 *   side: 'BUY',
 *   type: 'MARKET',
 *   quantity: 0.001,
 *   instrumentType: 'SPOT',
 * });
 * ```
 *
 * @see scripts/benchmark-native-sdk.ts for performance comparison
 */

import { MainClient, USDMClient } from "binance";
import { logger } from "@/lib/logger";
import type { CreateOrderParams, OrderResult } from "./types";

/**
 * Binance Native Service POC
 *
 * Minimal implementation for performance validation.
 * Only createOrder() is implemented.
 */
export class BinanceNativeServicePOC {
  private readonly mainClient: MainClient;
  private readonly usdmClient: USDMClient;

  constructor(
    apiKey: string,
    secretKey: string,
    options?: {
      testnet?: boolean;
      beautifyResponses?: boolean;
    },
  ) {
    logger.info("Initializing Binance Native Service POC", {
      testnet: options?.testnet ?? false,
    });

    // Initialize Spot/Margin client
    this.mainClient = new MainClient({
      api_key: apiKey,
      api_secret: secretKey,
      beautifyResponses: options?.beautifyResponses ?? true,
      ...(options?.testnet && { testnet: true }),
    });

    // Initialize USD-M Futures client
    this.usdmClient = new USDMClient({
      api_key: apiKey,
      api_secret: secretKey,
      beautifyResponses: options?.beautifyResponses ?? true,
      ...(options?.testnet && { testnet: true }),
    });
  }

  /**
   * Create order on Binance
   *
   * Routes to correct client based on instrumentType:
   * - SPOT → MainClient
   * - FUTURES_USDT → USDMClient
   *
   * @param params - Order parameters
   * @returns Order result with execution details
   *
   * @example
   * const order = await service.createOrder({
   *   symbol: 'BTCUSDT',
   *   side: 'BUY',
   *   type: 'MARKET',
   *   quantity: 0.001,
   *   instrumentType: 'SPOT',
   * });
   */
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const { symbol, side, type, instrumentType } = params;

    logger.info("Creating order with native SDK", {
      symbol,
      side,
      type,
      instrumentType,
    });

    try {
      // Route to correct client based on instrument type
      if (instrumentType === "FUTURES_USDT") {
        return await this.createFuturesOrder(params);
      }

      // Spot order (default)
      return await this.createSpotOrder(params);
    } catch (error) {
      logger.error("Failed to create order with native SDK", {
        error,
        params,
      });
      throw error;
    }
  }

  /**
   * Close connections (no-op for native SDK)
   *
   * Native SDK uses http.Agent with keepAlive,
   * connections are managed automatically.
   */
  async close(): Promise<void> {
    logger.debug("Closing Binance Native Service POC (no-op)");
  }

  /**
   * Create spot order via MainClient
   */
  private async createSpotOrder(
    params: CreateOrderParams,
  ): Promise<OrderResult> {
    const { symbol, side, type, quantity, price, timeInForce, clientOrderId } =
      params;

    // Build order params for Binance SDK
    const orderParams = {
      symbol,
      side: side === "BUY" ? ("BUY" as const) : ("SELL" as const),
      type: this.mapOrderTypeToBinance(type) as "MARKET" | "LIMIT",
      quantity,
      ...(price && { price }),
      ...(timeInForce && { timeInForce }),
      ...(clientOrderId && { newClientOrderId: clientOrderId }),
    };

    logger.debug("Submitting spot order", { orderParams });

    // Submit order via native SDK
    const startTime = Date.now();
    // POC: Type assertion needed due to SDK type strictness
    const binanceOrder = await this.mainClient.submitNewOrder(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderParams as any,
    );
    const latency = Date.now() - startTime;

    logger.info("Spot order executed via native SDK", {
      orderId: binanceOrder.orderId,
      latency: `${latency}ms`,
    });

    // Map Binance response to OrderResult
    return this.mapBinanceOrderToResult(binanceOrder, latency);
  }

  /**
   * Create futures order via USDMClient
   */
  private async createFuturesOrder(
    params: CreateOrderParams,
  ): Promise<OrderResult> {
    const {
      symbol,
      side,
      type,
      quantity,
      price,
      timeInForce,
      clientOrderId,
      positionSide,
      reduceOnly,
    } = params;

    // Build order params for Binance USD-M Futures
    const orderParams = {
      symbol,
      side: side === "BUY" ? ("BUY" as const) : ("SELL" as const),
      type: this.mapOrderTypeToBinance(type) as "MARKET" | "LIMIT",
      quantity,
      ...(price && { price }),
      ...(timeInForce && { timeInForce }),
      ...(clientOrderId && { newClientOrderId: clientOrderId }),
      ...(positionSide && { positionSide }),
      ...(reduceOnly !== undefined && { reduceOnly }),
    };

    logger.debug("Submitting futures order", { orderParams });

    // Submit order via native SDK
    const startTime = Date.now();
    // POC: Type assertion needed due to SDK type strictness
    const binanceOrder = await this.usdmClient.submitNewOrder(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderParams as any,
    );
    const latency = Date.now() - startTime;

    logger.info("Futures order executed via native SDK", {
      orderId: binanceOrder.orderId,
      latency: `${latency}ms`,
    });

    // Map Binance response to OrderResult
    return this.mapBinanceOrderToResult(binanceOrder, latency);
  }

  /**
   * Map internal order type to Binance order type
   */
  private mapOrderTypeToBinance(
    type: string,
  ):
    | "MARKET"
    | "LIMIT"
    | "STOP_LOSS"
    | "STOP_LOSS_LIMIT"
    | "TAKE_PROFIT"
    | "TAKE_PROFIT_LIMIT"
    | "LIMIT_MAKER" {
    switch (type.toUpperCase()) {
      case "MARKET":
        return "MARKET";
      case "LIMIT":
        return "LIMIT";
      case "STOP_LOSS":
      case "STOP":
        return "STOP_LOSS";
      case "STOP_LOSS_LIMIT":
        return "STOP_LOSS_LIMIT";
      case "TAKE_PROFIT":
        return "TAKE_PROFIT";
      case "TAKE_PROFIT_LIMIT":
        return "TAKE_PROFIT_LIMIT";
      default:
        return "MARKET";
    }
  }

  /**
   * Map Binance order status to our OrderStatus
   */
  private mapBinanceStatus(
    status: string,
  ): "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" {
    switch (status.toUpperCase()) {
      case "NEW":
        return "NEW";
      case "PARTIALLY_FILLED":
        return "PARTIALLY_FILLED";
      case "FILLED":
        return "FILLED";
      case "CANCELED":
      case "CANCELLED":
        return "CANCELED";
      case "REJECTED":
      case "EXPIRED":
        return "REJECTED";
      default:
        return "NEW";
    }
  }

  /**
   * Map Binance order response to OrderResult
   */
  private mapBinanceOrderToResult(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    binanceOrder: any,
    latency?: number,
  ): OrderResult {
    // Extract fills from response
    const fills =
      binanceOrder.fills?.map(
        (fill: {
          price: string;
          qty: string;
          commission: string;
          commissionAsset: string;
        }) => ({
          price: Number(fill.price),
          quantity: Number(fill.qty),
          fee: Number(fill.commission),
          feeCurrency: fill.commissionAsset,
        }),
      ) ?? [];

    // Calculate executed price (weighted average)
    const executedPrice =
      fills.length > 0
        ? fills.reduce(
            (sum: number, fill: { price: number; quantity: number }) =>
              sum + fill.price * fill.quantity,
            0,
          ) /
          fills.reduce(
            (sum: number, fill: { quantity: number }) => sum + fill.quantity,
            0,
          )
        : Number(binanceOrder.price ?? 0);

    const orderResult: OrderResult = {
      orderId: String(binanceOrder.orderId),
      clientOrderId: binanceOrder.clientOrderId ?? null,
      symbol: binanceOrder.symbol,
      status: this.mapBinanceStatus(binanceOrder.status),
      executedQty: Number(binanceOrder.executedQty ?? 0),
      executedPrice,
      cummulativeQuoteQty: Number(binanceOrder.cummulativeQuoteQty ?? 0),
      fills,
      transactTime: new Date(binanceOrder.transactTime ?? Date.now()),
      raw: binanceOrder,
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
