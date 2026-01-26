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

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Redis functions
vi.mock("@/lib/queue/circuit-breaker-redis", () => ({
  checkAndIncrementTrades: vi.fn().mockResolvedValue(undefined),
  incrementLoss: vi.fn().mockResolvedValue(undefined),
  getCounters: vi.fn().mockResolvedValue({ trades: 0, loss: 0 }),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    circuitBreaker: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
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
import { prisma } from "@/lib/prisma";

describe("Circuit Breaker Service", () => {
  const testUserId = "test-user-123";

  const defaultBreaker = {
    id: "breaker-1",
    userId: testUserId,
    maxDailyTrades: 20,
    maxLossPercent: { toNumber: () => 5.0 },
    maxLossAmount: null,
    dailyTradesCount: 0,
    dailyLossUsd: { toNumber: () => 0 },
    isTripped: false,
    tripReason: null,
    lastResetAt: new Date(),
    lastTrippedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkCircuitBreaker", () => {
    it("should create circuit breaker with default limits if not exists", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.circuitBreaker.create).mockResolvedValue(
        defaultBreaker as never,
      );

      await checkCircuitBreaker(testUserId);

      expect(prisma.circuitBreaker.create).toHaveBeenCalledWith({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
        },
      });
    });

    it("should pass if not tripped and Redis allows", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue(
        defaultBreaker as never,
      );

      await expect(checkCircuitBreaker(testUserId)).resolves.not.toThrow();
      expect(mockCheckAndIncrementTrades).toHaveBeenCalledWith(testUserId, 20);
    });

    it("should throw CircuitBreakerTrippedError if already tripped", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue({
        ...defaultBreaker,
        isTripped: true,
        tripReason: "max_trades",
      } as never);

      await expect(checkCircuitBreaker(testUserId)).rejects.toThrow(
        CircuitBreakerTrippedError,
      );
    });

    it("should throw CircuitBreakerTrippedError when Redis reports limit exceeded", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue(
        defaultBreaker as never,
      );
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
      // This is now a no-op - counter increment happens in checkCircuitBreaker
      await expect(incrementTradeCounter(testUserId)).resolves.not.toThrow();
    });
  });

  describe("recordLoss", () => {
    it("should not throw when loss is recorded", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue({
        ...defaultBreaker,
        maxLossAmount: { toNumber: () => 1000 },
      } as never);

      await expect(recordLoss(testUserId, 50)).resolves.not.toThrow();
    });

    it("should skip if circuit breaker not found", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue(null);

      // No circuit breaker exists for user - should not throw
      await expect(recordLoss(testUserId, 50)).resolves.not.toThrow();
    });
  });

  describe("manual controls", () => {
    it("should manually trip circuit breaker", async () => {
      vi.mocked(prisma.circuitBreaker.update).mockResolvedValue({
        ...defaultBreaker,
        isTripped: true,
        tripReason: "manual",
        lastTrippedAt: new Date(),
      } as never);

      await manualTripCircuitBreaker(testUserId);

      expect(prisma.circuitBreaker.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: {
          isTripped: true,
          tripReason: "manual",
          lastTrippedAt: expect.any(Date),
        },
      });
    });

    it("should manually reset circuit breaker", async () => {
      vi.mocked(prisma.circuitBreaker.update).mockResolvedValue({
        ...defaultBreaker,
        isTripped: false,
        tripReason: null,
      } as never);

      await manualResetCircuitBreaker(testUserId);

      expect(prisma.circuitBreaker.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: {
          isTripped: false,
          tripReason: null,
        },
      });
    });
  });

  describe("getCircuitBreakerStatus", () => {
    it("should return current status with Redis counters", async () => {
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue({
        ...defaultBreaker,
        maxLossAmount: { toNumber: () => 1000 },
      } as never);
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
      vi.mocked(prisma.circuitBreaker.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.circuitBreaker.create).mockResolvedValue(
        defaultBreaker as never,
      );

      const status = await getCircuitBreakerStatus(testUserId);

      expect(status.isTripped).toBe(false);
      expect(status.maxDailyTrades).toBe(20);
      expect(status.dailyTradesCount).toBe(0);
    });
  });

  describe("updateCircuitBreakerConfig", () => {
    it("should update configuration", async () => {
      vi.mocked(prisma.circuitBreaker.update).mockResolvedValue({
        ...defaultBreaker,
        maxDailyTrades: 50,
        maxLossAmount: { toNumber: () => 2000 },
      } as never);

      await updateCircuitBreakerConfig(testUserId, {
        maxDailyTrades: 50,
        maxLossAmount: 2000,
      });

      expect(prisma.circuitBreaker.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: {
          maxDailyTrades: 50,
          maxLossAmount: 2000,
        },
      });
    });
  });
});
