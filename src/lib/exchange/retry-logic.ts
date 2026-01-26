/**
 * Retry Logic with Exponential Backoff
 *
 * Provides retry functionality for exchange operations with:
 * - Exponential backoff for network errors
 * - No retry for permanent errors (AuthenticationError, InsufficientFunds, etc.)
 * - Configurable max attempts and delays
 * - Proper error propagation
 */

import { logger } from "@/lib/logger";
import {
  getRetryDelay,
  isRetryableError,
  mapCCXTError,
  type ExchangeBaseError,
} from "./errors";

/**
 * Configuration for retry behavior
 */
export type RetryConfig = {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxAttempts?: number;

  /**
   * Base delay in milliseconds for exponential backoff (default: 1000)
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds between retries (default: 30000)
   */
  maxDelay?: number;

  /**
   * Exchange name for logging context
   */
  exchange?: string;

  /**
   * Operation name for logging context
   */
  operation?: string;
};

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 * @throws Last error if all retries exhausted or permanent error encountered
 *
 * @example
 * ```typescript
 * const balance = await withRetry(
 *   () => exchange.fetchBalance(),
 *   { exchange: 'binance', operation: 'fetchBalance' }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exchange,
    operation = "operation",
  } = config;

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      // Execute function
      // eslint-disable-next-line no-await-in-loop
      const result = await fn();

      // Log retry success if this was a retry attempt
      if (attempt > 0) {
        logger.info(`${operation} succeeded after ${attempt} retries`, {
          exchange,
          attempt,
        });
      }

      return result;
    } catch (error) {
      // Map CCXT error to our custom error types
      const mappedError = mapCCXTError(error, exchange);
      lastError = mappedError;

      // Check if error is retryable
      if (!isRetryableError(mappedError)) {
        logger.error(`${operation} failed with permanent error`, {
          exchange,
          error: mappedError.message,
          errorType: mappedError.constructor.name,
          attempt,
        });
        throw mappedError;
      }

      // Calculate retry delay
      const delay = getRetryDelay(mappedError, attempt, baseDelay);

      // No more retries if delay is null or we've reached max attempts
      if (delay === null || attempt >= maxAttempts - 1) {
        logger.error(`${operation} failed after ${attempt + 1} attempts`, {
          exchange,
          error: mappedError.message,
          errorType: mappedError.constructor.name,
          totalAttempts: attempt + 1,
        });
        throw mappedError;
      }

      // Cap delay at maxDelay
      const cappedDelay = Math.min(delay, maxDelay);

      logger.warn(`${operation} failed, retrying in ${cappedDelay}ms`, {
        exchange,
        error: mappedError.message,
        errorType: mappedError.constructor.name,
        attempt: attempt + 1,
        nextDelay: cappedDelay,
      });

      // Wait before retry
      // eslint-disable-next-line no-await-in-loop
      await sleep(cappedDelay);
      attempt++;
    }
  }

  // Should not reach here, but throw last error just in case
  throw (
    lastError ?? new Error(`${operation} failed after ${maxAttempts} attempts`)
  );
}

/**
 * Create a retry wrapper for a specific exchange and operation
 * Returns a function that will retry the wrapped function
 *
 * @example
 * ```typescript
 * class BinanceService {
 *   private retry = createRetryWrapper('binance');
 *
 *   async fetchBalance() {
 *     return this.retry(
 *       () => this.exchange.fetchBalance(),
 *       'fetchBalance'
 *     );
 *   }
 * }
 * ```
 */
export function createRetryWrapper(exchange: string) {
  return async function retry<T>(
    fn: () => Promise<T>,
    operation: string,
    config?: Omit<RetryConfig, "exchange" | "operation">,
  ): Promise<T> {
    return withRetry(fn, {
      ...config,
      exchange,
      operation,
    });
  };
}

/**
 * Batch retry operations with individual error handling
 * Useful for fetching data from multiple symbols
 *
 * @param operations - Array of async functions to execute
 * @param config - Retry configuration for each operation
 * @returns Array of results (successful) and errors (failed)
 *
 * @example
 * ```typescript
 * const results = await batchRetry([
 *   () => exchange.fetchTicker('BTC/USDT'),
 *   () => exchange.fetchTicker('ETH/USDT'),
 * ], { exchange: 'binance', operation: 'fetchTicker' });
 * ```
 */
export async function batchRetry<T>(
  operations: (() => Promise<T>)[],
  config: RetryConfig = {},
): Promise<
  ({ success: true; data: T } | { success: false; error: ExchangeBaseError })[]
> {
  const promises = operations.map(async (fn) => {
    try {
      const data = await withRetry(fn, config);
      return { success: true as const, data };
    } catch (error) {
      return {
        success: false as const,
        error: mapCCXTError(error, config.exchange),
      };
    }
  });

  return Promise.all(promises);
}
