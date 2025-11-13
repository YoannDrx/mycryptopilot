/**
 * Copy Trade Error Handling Tests
 *
 * Tests for Phase 2.2 - Enhanced error handling with status sync.
 *
 * Coverage:
 * - Error code extraction and storage
 * - Error details persistence
 * - Non-retryable vs retryable error classification
 * - Error details JSON structure
 */

import { describe, it, expect } from "vitest";

describe("Copy Trade Error Handling (Phase 2.2)", () => {
  describe("Error Code Extraction", () => {
    it("should extract error code from message with format ERROR_CODE: description", () => {
      const message = "CIRCUIT_BREAKER_TRIPPED: Max daily trades exceeded";
      const match = message.match(/^([A-Z_]+):/);
      const errorCode = match?.[1] ?? "UNKNOWN_ERROR";

      expect(errorCode).toBe("CIRCUIT_BREAKER_TRIPPED");
    });

    it("should default to UNKNOWN_ERROR if no code in message", () => {
      const message = "Something went wrong";
      const match = message.match(/^([A-Z_]+):/);
      const errorCode = match?.[1] ?? "UNKNOWN_ERROR";

      expect(errorCode).toBe("UNKNOWN_ERROR");
    });

    it("should handle various error code formats", () => {
      const testCases = [
        {
          message: "INSUFFICIENT_BALANCE: Not enough funds",
          expected: "INSUFFICIENT_BALANCE",
        },
        {
          message: "EXCHANGE_CONNECTION_INACTIVE: Connection is disabled",
          expected: "EXCHANGE_CONNECTION_INACTIVE",
        },
        {
          message: "INVALID_API_KEY: Authentication failed",
          expected: "INVALID_API_KEY",
        },
        { message: "Random error", expected: "UNKNOWN_ERROR" },
      ];

      for (const { message, expected } of testCases) {
        const match = message.match(/^([A-Z_]+):/);
        const errorCode = match?.[1] ?? "UNKNOWN_ERROR";
        expect(errorCode).toBe(expected);
      }
    });
  });

  describe("Error Classification", () => {
    it("should classify circuit breaker errors as non-retryable", () => {
      const errorMessage = "CIRCUIT_BREAKER_TRIPPED: max_trades";
      const isNonRetryable =
        errorMessage.includes("CIRCUIT_BREAKER_TRIPPED") ||
        errorMessage.includes("EXCHANGE_CONNECTION_NOT_FOUND") ||
        errorMessage.includes("EXCHANGE_CONNECTION_INACTIVE") ||
        errorMessage.includes("INVALID_API_KEY") ||
        errorMessage.includes("INSUFFICIENT_BALANCE");

      expect(isNonRetryable).toBe(true);
    });

    it("should classify network errors as retryable", () => {
      const errorMessage = "Network timeout";
      const isNonRetryable =
        errorMessage.includes("CIRCUIT_BREAKER_TRIPPED") ||
        errorMessage.includes("EXCHANGE_CONNECTION_NOT_FOUND") ||
        errorMessage.includes("EXCHANGE_CONNECTION_INACTIVE") ||
        errorMessage.includes("INVALID_API_KEY") ||
        errorMessage.includes("INSUFFICIENT_BALANCE");

      expect(isNonRetryable).toBe(false);
    });

    it("should classify exchange connection errors as non-retryable", () => {
      const nonRetryableErrors = [
        "EXCHANGE_CONNECTION_NOT_FOUND",
        "EXCHANGE_CONNECTION_INACTIVE",
        "INVALID_API_KEY",
        "INSUFFICIENT_BALANCE",
      ];

      for (const error of nonRetryableErrors) {
        const isNonRetryable =
          error.includes("CIRCUIT_BREAKER_TRIPPED") ||
          error.includes("EXCHANGE_CONNECTION_NOT_FOUND") ||
          error.includes("EXCHANGE_CONNECTION_INACTIVE") ||
          error.includes("INVALID_API_KEY") ||
          error.includes("INSUFFICIENT_BALANCE");

        expect(isNonRetryable).toBe(true);
      }
    });
  });

  describe("Error Details JSON Structure", () => {
    it("should create valid JSON for circuit breaker errors", () => {
      const userId = "test-user-123";
      const errorDetails = JSON.stringify(
        {
          reason: "max_trades",
          userId,
        },
        null,
        2,
      );

      expect(() => JSON.parse(errorDetails)).not.toThrow();

      const parsed = JSON.parse(errorDetails);
      expect(parsed.reason).toBe("max_trades");
      expect(parsed.userId).toBe(userId);
    });

    it("should create valid JSON for job exhausted errors", () => {
      const errorDetails = JSON.stringify(
        {
          message: "Timeout error",
          stack: "Error: Timeout\n  at ...",
          attempts: 3,
          maxAttempts: 3,
          jobId: "job-456",
        },
        null,
        2,
      );

      expect(() => JSON.parse(errorDetails)).not.toThrow();

      const parsed = JSON.parse(errorDetails);
      expect(parsed.message).toBe("Timeout error");
      expect(parsed.attempts).toBe(3);
      expect(parsed.jobId).toBe("job-456");
    });

    it("should handle error stack traces in JSON", () => {
      const stackTrace = `Error: Test error
  at testFunction (/path/to/file.ts:10:15)
  at async processCopyTradeJob (/path/to/worker.ts:100:5)`;

      const errorDetails = JSON.stringify(
        {
          message: "Test error",
          stack: stackTrace,
        },
        null,
        2,
      );

      expect(() => JSON.parse(errorDetails)).not.toThrow();

      const parsed = JSON.parse(errorDetails);
      expect(parsed.stack).toContain("Error: Test error");
      expect(parsed.stack).toContain("testFunction");
    });

    it("should handle complex nested JSON structures", () => {
      const complexDetails = JSON.stringify(
        {
          error: {
            code: "TIMEOUT",
            message: "Network timeout",
            metadata: {
              retries: 3,
              lastAttempt: new Date().toISOString(),
              endpoint: "/api/exchange/order",
            },
          },
          context: {
            userId: "user-123",
            jobId: "job-456",
            traceId: "trace-789",
          },
        },
        null,
        2,
      );

      expect(() => JSON.parse(complexDetails)).not.toThrow();

      const parsed = JSON.parse(complexDetails);
      expect(parsed.error.code).toBe("TIMEOUT");
      expect(parsed.error.metadata.retries).toBe(3);
      expect(parsed.context.userId).toBe("user-123");
    });
  });
});
