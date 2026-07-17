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
import { BitgetNativeService } from "./bitget-native-service";

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
  | (BybitNativeService & ExchangeAdapter)
  | (BitgetNativeService & ExchangeAdapter);

export const PUBLIC_READ_ONLY_EXCHANGES = ["BINANCE", "BYBIT"] as const;

export class ExchangeMutationDisabledError extends Error {
  constructor(operation: "createOrder" | "cancelOrder") {
    super(
      `${operation} is disabled: MyCryptoPilot only supports read-only exchange access.`,
    );
    this.name = "ExchangeMutationDisabledError";
  }
}

function enforceReadOnlyAdapter(service: ExchangeService): ExchangeService {
  return new Proxy(service, {
    get(target, property) {
      if (property === "createOrder" || property === "cancelOrder") {
        return async () => {
          throw new ExchangeMutationDisabledError(property);
        };
      }

      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

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
  options?: { passphrase?: string | null; bitgetAccountMode?: "UTA" | "CLASSIC" },
): ExchangeService {
  switch (exchange) {
    case "BINANCE":
      return enforceReadOnlyAdapter(
        new BinanceNativeService(apiKey, secretKey),
      );
    case "BYBIT":
      return enforceReadOnlyAdapter(new BybitNativeService(apiKey, secretKey));
    case "BITGET":
      return enforceReadOnlyAdapter(
        new BitgetNativeService(
          apiKey,
          secretKey,
          options?.passphrase ?? null,
          {
            accountMode: options?.bitgetAccountMode ?? null,
          },
        ),
      );
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
  return ["BINANCE", "BYBIT", "BITGET"];
}

/**
 * Check if exchange is supported
 *
 * @param exchange - Exchange name to check
 * @returns True if exchange is supported
 */
export function isExchangeSupported(exchange: string): exchange is Exchange {
  return ["BINANCE", "BYBIT", "BITGET"].includes(exchange);
}

export function isPublicReadOnlyExchange(
  exchange: string,
): exchange is (typeof PUBLIC_READ_ONLY_EXCHANGES)[number] {
  return PUBLIC_READ_ONLY_EXCHANGES.some((item) => item === exchange);
}
