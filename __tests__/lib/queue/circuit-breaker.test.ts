/**
 * Circuit Breaker Service Tests
 *
 * Tests for the circuit breaker risk management system.
 *
 * Coverage:
 * - Circuit breaker creation (default limits)
 * - Manual trip/reset
 * - Status retrieval
 * - Config updates
 *
 * Note: Trade counting and loss tracking are now handled by Redis.
 * See circuit-breaker-atomic.test.ts for atomic operation tests.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock Redis functions to isolate Prisma-based tests
vi.mock("@/lib/queue/circuit-breaker-redis", () => ({
  checkAndIncrementTrades: vi.fn().mockResolvedValue(undefined),
  incrementLoss: vi.fn().mockResolvedValue(undefined),
  getCounters: vi.fn().mockResolvedValue({ trades: 0, loss: 0 }),
}));

import {
  checkCircuitBreaker,
  incrementTradeCounter,
  recordLoss,
  manualTripCircuitBreaker,
  manualResetCircuitBreaker,
  getCircuitBreakerStatus,
  updateCircuitBreakerConfig,
  CircuitBreakerTrippedError,
} from "@/lib/queue/circuit-breaker.service";
import {
  checkAndIncrementTrades as mockCheckAndIncrementTrades,
  getCounters as mockGetCounters,
} from "@/lib/queue/circuit-breaker-redis";

describe("Circuit Breaker Service", () => {
  const testUserId = "test-user-123";

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clean up test data
    await prisma.circuitBreaker.deleteMany({
      where: { userId: testUserId },
    });
  });

  afterEach(async () => {
    await prisma.circuitBreaker.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe("checkCircuitBreaker", () => {
    it("should create circuit breaker with default limits if not exists", async () => {
      await checkCircuitBreaker(testUserId);

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker).toBeDefined();
      expect(breaker?.maxDailyTrades).toBe(20);
      expect(breaker?.maxLossPercent.toNumber()).toBe(5.0);
      expect(breaker?.isTripped).toBe(false);
    });

    it("should pass if not tripped and Redis allows", async () => {
      // Create breaker
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });

      await expect(checkCircuitBreaker(testUserId)).resolves.not.toThrow();
      expect(mockCheckAndIncrementTrades).toHaveBeenCalledWith(testUserId, 20);
    });

    it("should throw CircuitBreakerTrippedError if already tripped", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          isTripped: true,
          tripReason: "max_trades",
        },
      });

      await expect(checkCircuitBreaker(testUserId)).rejects.toThrow(
        CircuitBreakerTrippedError,
      );
      await expect(checkCircuitBreaker(testUserId)).rejects.toThrow(
        "max_trades",
      );
    });

    it("should throw CircuitBreakerTrippedError when Redis reports limit exceeded", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });

      // Mock Redis to throw limit exceeded error
      vi.mocked(mockCheckAndIncrementTrades).mockRejectedValueOnce(
        new CircuitBreakerTrippedError(
          "Max daily trades exceeded (20)",
          "max_trades",
          testUserId,
        ),
      );

      await expect(checkCircuitBreaker(testUserId)).rejects.toThrow(
        CircuitBreakerTrippedError,
      );
    });
  });

  describe("incrementTradeCounter", () => {
    it("should be a no-op (deprecated with atomic pattern)", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });

      // This is now a no-op - counter increment happens in checkCircuitBreaker
      await expect(incrementTradeCounter(testUserId)).resolves.not.toThrow();
    });
  });

  describe("recordLoss", () => {
    it("should not throw when loss is recorded", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          maxLossAmount: 1000,
        },
      });

      await expect(recordLoss(testUserId, 50)).resolves.not.toThrow();
    });

    it("should skip if circuit breaker not found", async () => {
      // No circuit breaker exists for user
      await expect(recordLoss(testUserId, 50)).resolves.not.toThrow();
    });
  });

  describe("manual controls", () => {
    it("should manually trip circuit breaker", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });

      await manualTripCircuitBreaker(testUserId);

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.isTripped).toBe(true);
      expect(breaker?.tripReason).toBe("manual");
      expect(breaker?.lastTrippedAt).toBeDefined();
    });

    it("should manually reset circuit breaker", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          isTripped: true,
          tripReason: "manual",
        },
      });

      await manualResetCircuitBreaker(testUserId);

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.isTripped).toBe(false);
      expect(breaker?.tripReason).toBeNull();
    });
  });

  describe("getCircuitBreakerStatus", () => {
    it("should return current status with Redis counters", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          maxLossAmount: 1000,
          isTripped: false,
        },
      });

      // Mock Redis counters
      vi.mocked(mockGetCounters).mockResolvedValueOnce({
        trades: 10,
        loss: 250,
      });

      const status = await getCircuitBreakerStatus(testUserId);

      expect(status.isTripped).toBe(false);
      expect(status.dailyTradesCount).toBe(10);
      expect(status.maxDailyTrades).toBe(20);
      expect(status.dailyLossUsd).toBe(250);
      expect(status.maxLossAmount).toBe(1000);
    });

    it("should create default breaker if not exists", async () => {
      const status = await getCircuitBreakerStatus(testUserId);

      expect(status.isTripped).toBe(false);
      expect(status.maxDailyTrades).toBe(20);
      expect(status.dailyTradesCount).toBe(0);
    });
  });

  describe("updateCircuitBreakerConfig", () => {
    it("should update configuration", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });

      await updateCircuitBreakerConfig(testUserId, {
        maxDailyTrades: 50,
        maxLossAmount: 2000,
      });

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.maxDailyTrades).toBe(50);
      expect(breaker?.maxLossAmount?.toNumber()).toBe(2000);
    });
  });
});
