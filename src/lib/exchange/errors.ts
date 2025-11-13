/**
 * Exchange Service Errors
 *
 * Custom error classes for exchange operations, mirroring CCXT error hierarchy.
 * Organized into two main categories:
 * 1. ExchangeError - Permanent errors (don't retry)
 * 2. NetworkError - Recoverable errors (can retry)
 */

/**
 * Base error class for all exchange-related errors
 */
export class ExchangeBaseError extends Error {
  constructor(
    message: string,
    public readonly exchange?: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ======================
 * PERMANENT ERRORS (Don't Retry)
 * ======================
 */

/**
 * Exchange-specific error (permanent, don't retry)
 * Base class for all business logic errors from the exchange
 */
export class ExchangeError extends ExchangeBaseError {}

/**
 * Authentication failed - Wrong API keys or signature
 * Don't retry - User needs to fix credentials
 */
export class AuthenticationError extends ExchangeError {}

/**
 * Permission denied - API keys don't have required permissions
 * Don't retry - User needs to enable permissions
 */
export class PermissionDeniedError extends ExchangeError {}

/**
 * Insufficient funds - Not enough balance to execute order
 * Don't retry - User needs to add funds
 */
export class InsufficientFundsError extends ExchangeError {}

/**
 * Invalid order - Wrong parameters (price, quantity, symbol, etc.)
 * Don't retry - Caller needs to fix parameters
 */
export class InvalidOrderError extends ExchangeError {}

/**
 * Order not found - Order ID doesn't exist
 * Don't retry - Order might have been cancelled or never existed
 */
export class OrderNotFoundError extends ExchangeError {}

/**
 * Bad symbol - Trading pair doesn't exist or is not available
 * Don't retry - Caller needs to use valid symbol
 */
export class BadSymbolError extends ExchangeError {}

/**
 * Invalid precision - Price or quantity has wrong decimal places
 * Don't retry - Caller needs to adjust precision
 */
export class InvalidPrecisionError extends ExchangeError {}

/**
 * Bad request - Generic invalid request error
 * Don't retry - Caller needs to fix request
 */
export class BadRequestError extends ExchangeError {}

/**
 * Not supported - Operation not supported by this exchange
 * Don't retry - Use different operation
 */
export class NotSupportedError extends ExchangeError {}

/**
 * Account suspended - User account is suspended or banned
 * Don't retry - User needs to contact exchange support
 */
export class AccountSuspendedError extends ExchangeError {}

/**
 * ======================
 * RECOVERABLE ERRORS (Can Retry)
 * ======================
 */

/**
 * Network error (recoverable, can retry)
 * Base class for all temporary/network-related errors
 */
export class NetworkError extends ExchangeBaseError {}

/**
 * Request timeout - Request took too long
 * Retry recommended with exponential backoff
 */
export class RequestTimeoutError extends NetworkError {}

/**
 * Rate limit exceeded - Too many requests
 * Retry recommended after waiting (use exchange.rateLimit)
 */
export class RateLimitExceededError extends NetworkError {
  constructor(
    message: string,
    exchange?: string,
    originalError?: unknown,
    public readonly retryAfter?: number, // milliseconds to wait
  ) {
    super(message, exchange, originalError);
  }
}

/**
 * DDoS protection triggered - Exchange is protecting against attacks
 * Retry recommended with longer backoff
 */
export class DDoSProtectionError extends NetworkError {}

/**
 * Exchange not available - Maintenance or temporary downtime
 * Retry recommended after delay
 */
export class ExchangeNotAvailableError extends NetworkError {}

/**
 * Invalid nonce - Timestamp synchronization issue
 * Retry recommended (CCXT usually handles this automatically)
 */
export class InvalidNonceError extends NetworkError {}

/**
 * Connection error - Network connectivity issue
 * Retry recommended
 */
export class ConnectionError extends NetworkError {}

/**
 * ======================
 * ERROR MAPPING HELPERS
 * ======================
 */

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return error instanceof NetworkError;
}

/**
 * Check if error is permanent (don't retry)
 */
export function isPermanentError(error: unknown): boolean {
  return error instanceof ExchangeError;
}

/**
 * Get retry delay for network errors
 * Returns delay in milliseconds, or null if should not retry
 */
export function getRetryDelay(
  error: unknown,
  attempt: number,
  baseDelay = 1000,
): number | null {
  // Don't retry permanent errors
  if (isPermanentError(error)) {
    return null;
  }

  // For rate limit errors, use retryAfter if provided
  if (error instanceof RateLimitExceededError && error.retryAfter) {
    return error.retryAfter;
  }

  // Don't retry if max attempts exceeded (max 3 attempts)
  if (attempt >= 3) {
    return null;
  }

  // Exponential backoff: baseDelay * 2^attempt, capped at 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);

  return delay;
}

/**
 * Map CCXT error to custom error class
 * @param error - Original CCXT error
 * @param exchange - Exchange name for context
 */
export function mapCCXTError(error: unknown, exchange?: string): Error {
  if (!(error instanceof Error)) {
    return new ExchangeBaseError("Unknown error occurred", exchange, error);
  }

  const errorName = error.constructor.name;
  const message = error.message;

  // Network errors (recoverable)
  if (errorName.includes("NetworkError")) {
    return new NetworkError(message, exchange, error);
  }
  if (errorName.includes("RequestTimeout")) {
    return new RequestTimeoutError(message, exchange, error);
  }
  if (errorName.includes("RateLimitExceeded")) {
    return new RateLimitExceededError(message, exchange, error);
  }
  if (errorName.includes("DDoSProtection")) {
    return new DDoSProtectionError(message, exchange, error);
  }
  if (errorName.includes("ExchangeNotAvailable")) {
    return new ExchangeNotAvailableError(message, exchange, error);
  }
  if (errorName.includes("InvalidNonce")) {
    return new InvalidNonceError(message, exchange, error);
  }
  if (message.includes("ECONNRESET") || message.includes("ETIMEDOUT")) {
    return new ConnectionError(message, exchange, error);
  }

  // Exchange errors (permanent)
  if (errorName.includes("AuthenticationError")) {
    return new AuthenticationError(message, exchange, error);
  }
  if (errorName.includes("PermissionDenied")) {
    return new PermissionDeniedError(message, exchange, error);
  }
  if (errorName.includes("InsufficientFunds")) {
    return new InsufficientFundsError(message, exchange, error);
  }
  if (errorName.includes("InvalidOrder")) {
    return new InvalidOrderError(message, exchange, error);
  }
  if (errorName.includes("OrderNotFound")) {
    return new OrderNotFoundError(message, exchange, error);
  }
  if (errorName.includes("BadSymbol")) {
    return new BadSymbolError(message, exchange, error);
  }
  if (errorName.includes("BadRequest")) {
    return new BadRequestError(message, exchange, error);
  }
  if (errorName.includes("NotSupported")) {
    return new NotSupportedError(message, exchange, error);
  }
  if (errorName.includes("AccountSuspended")) {
    return new AccountSuspendedError(message, exchange, error);
  }

  // Check error message for specific patterns
  if (message.includes("insufficient") || message.includes("balance")) {
    return new InsufficientFundsError(message, exchange, error);
  }
  if (message.includes("precision") || message.includes("decimal")) {
    return new InvalidPrecisionError(message, exchange, error);
  }
  if (message.includes("authentication") || message.includes("api key")) {
    return new AuthenticationError(message, exchange, error);
  }
  if (message.includes("permission")) {
    return new PermissionDeniedError(message, exchange, error);
  }

  // Default to generic ExchangeError
  if (errorName.includes("ExchangeError")) {
    return new ExchangeError(message, exchange, error);
  }

  // Fallback to base error
  return new ExchangeBaseError(message, exchange, error);
}
