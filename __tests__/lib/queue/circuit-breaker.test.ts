/**
 * Circuit Breaker Service Tests
 *
 * Tests for the circuit breaker risk management system.
 *
 * Coverage:
 * - Circuit breaker creation (default limits)
 * - Daily trade limit checks
 * - Daily loss limit checks
 * - Daily reset logic (UTC midnight)
 * - Manual trip/reset
 * - Counter increments
 * - Loss recording
 */

import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
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

describe("Circuit Breaker Service", () => {
  const testUserId = "test-user-123";

  beforeEach(async () => {
    // Clean up test data
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
      expect(breaker?.dailyTradesCount).toBe(0);
      expect(breaker?.dailyLossUsd.toNumber()).toBe(0);
      expect(breaker?.isTripped).toBe(false);
    });

    it("should pass if limits not exceeded", async () => {
      // Create breaker with some usage but not exceeding limits
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          dailyTradesCount: 10,
          dailyLossUsd: 100,
        },
      });

      await expect(checkCircuitBreaker(testUserId)).resolves.not.toThrow();
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

    it("should trip circuit breaker if max daily trades exceeded", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          dailyTradesCount: 20, // At limit
        },
      });

      await expect(checkCircuitBreaker(testUserId)).rejects.toThrow(
        CircuitBreakerTrippedError,
      );

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.isTripped).toBe(true);
      expect(breaker?.tripReason).toBe("max_trades");
      expect(breaker?.lastTrippedAt).toBeDefined();
    });

    it("should trip circuit breaker if max loss amount exceeded", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          maxLossAmount: 1000,
          dailyLossUsd: 1000, // At limit
        },
      });

      await expect(checkCircuitBreaker(testUserId)).rejects.toThrow(
        CircuitBreakerTrippedError,
      );

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.isTripped).toBe(true);
      expect(breaker?.tripReason).toBe("max_loss");
    });

    it("should reset counters on new UTC day", async () => {
      // Create breaker with yesterday's timestamp
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          dailyTradesCount: 15,
          dailyLossUsd: 500,
          isTripped: true,
          tripReason: "max_trades",
          lastResetAt: yesterday,
        },
      });

      await checkCircuitBreaker(testUserId);

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.dailyTradesCount).toBe(0);
      expect(breaker?.dailyLossUsd.toNumber()).toBe(0);
      expect(breaker?.isTripped).toBe(false);
      expect(breaker?.tripReason).toBeNull();
    });
  });

  describe("incrementTradeCounter", () => {
    it("should increment daily trades count", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          dailyTradesCount: 5,
        },
      });

      await incrementTradeCounter(testUserId);

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.dailyTradesCount).toBe(6);
    });
  });

  describe("recordLoss", () => {
    it("should increment daily loss", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          maxLossAmount: 1000,
          dailyLossUsd: 100,
        },
      });

      await recordLoss(testUserId, 50);

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.dailyLossUsd.toNumber()).toBe(150);
    });

    it("should trip circuit breaker if loss limit exceeded", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          maxLossAmount: 1000,
          dailyLossUsd: 950,
        },
      });

      await recordLoss(testUserId, 100); // Total 1050 > 1000

      const breaker = await prisma.circuitBreaker.findUnique({
        where: { userId: testUserId },
      });

      expect(breaker?.isTripped).toBe(true);
      expect(breaker?.tripReason).toBe("max_loss");
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
    it("should return current status", async () => {
      await prisma.circuitBreaker.create({
        data: {
          userId: testUserId,
          maxDailyTrades: 20,
          maxLossPercent: 5.0,
          maxLossAmount: 1000,
          dailyTradesCount: 10,
          dailyLossUsd: 250,
          isTripped: false,
        },
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
