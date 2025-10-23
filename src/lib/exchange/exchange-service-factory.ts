import type { Exchange } from "@/generated/prisma";
import { BinanceService } from "./binance-service";
import { BybitService } from "./bybit-service";

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

export type ExchangeService = BinanceService | BybitService;

/**
 * Create exchange service instance based on exchange type
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
      return new BinanceService(apiKey, secretKey);
    case "BYBIT":
      return new BybitService(apiKey, secretKey);
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
