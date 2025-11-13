import type { Exchange } from "@/generated/prisma";
import type {
  CancelOrderParams,
  ConnectionStatus,
  ConsolidatedBalance,
  CreateOrderParams,
  NormalizedTrade,
  OrderResult,
  OrderStatus,
  PaginationCursor,
  PositionSnapshot,
  RateLimitInfo,
} from "@/lib/exchange/types";
import { BinanceNativeService } from "./binance-native-service";
import { BybitNativeService } from "./bybit-native-service";

/**
 * Exchange Service Factory
 *
 * Provides abstraction for creating exchange service instances.
 * Supports multiple exchanges (Binance, Bybit, etc.)
 *
 * @example
 * const service = createExchangeService("BINANCE", apiKey, secretKey);
 * await service.validateApiKeys();
 * const trades = await service.fetchRecentTrades(30);
 * await service.close();
 */

export type PaginationOptions = {
  since?: number;
  limit?: number;
  cursor?: PaginationCursor;
};

export type FetchTradesResult = {
  trades: NormalizedTrade[];
  cursor: PaginationCursor;
};

export type ExchangeAdapter = {
  fetchConsolidatedBalance: () => Promise<ConsolidatedBalance>;
  fetchOpenPositions: () => Promise<PositionSnapshot[]>;
  fetchTradesPaginated: (
    symbol: string,
    options?: PaginationOptions,
  ) => Promise<FetchTradesResult>;
  testConnection: () => Promise<ConnectionStatus>;
  getRateLimitInfo: () => RateLimitInfo | null;
  createOrder: (params: CreateOrderParams) => Promise<OrderResult>;
  cancelOrder: (params: CancelOrderParams) => Promise<void>;
  getOrderStatus: (params: CancelOrderParams) => Promise<OrderStatus>;
  close: () => Promise<void>;
};

export type ExchangeService =
  | (BinanceNativeService & ExchangeAdapter)
  | (BybitNativeService & ExchangeAdapter);

/**
 * Create exchange service instance based on exchange type
 *
 * Now uses native SDKs (4.2x faster than CCXT):
 * - Binance: tiagosiebler/binance SDK
 * - Bybit: tiagosiebler/bybit-api SDK
 *
 * @param exchange - Exchange name (BINANCE, BYBIT)
 * @param apiKey - API key for authentication
 * @param secretKey - Secret key for authentication
 * @returns Exchange service instance
 * @throws Error if exchange is not supported
 */
export function createExchangeService(
  exchange: Exchange,
  apiKey: string,
  secretKey: string,
): ExchangeService {
  switch (exchange) {
    case "BINANCE":
      return new BinanceNativeService(apiKey, secretKey);
    case "BYBIT":
      return new BybitNativeService(apiKey, secretKey);
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = exchange;
      throw new Error(`Unsupported exchange: ${_exhaustive}`);
    }
  }
}

/**
 * Get list of supported exchanges
 *
 * @returns Array of supported exchange names
 */
export function getSupportedExchanges(): Exchange[] {
  return ["BINANCE", "BYBIT"];
}

/**
 * Check if exchange is supported
 *
 * @param exchange - Exchange name to check
 * @returns True if exchange is supported
 */
export function isExchangeSupported(exchange: string): exchange is Exchange {
  return ["BINANCE", "BYBIT"].includes(exchange);
}
