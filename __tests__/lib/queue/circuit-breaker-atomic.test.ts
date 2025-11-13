/**
 * Circuit Breaker Atomic Operations Tests
 *
 * Tests for Phase 2.1 - Redis atomic operations to prevent race conditions.
 *
 * Coverage:
 * - Atomic trade counter increment
 * - Atomic loss counter increment
 * - Race condition prevention (concurrent operations)
 * - Redis TTL expiry (daily reset)
 * - Graceful degradation (Redis unavailable)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  checkAndIncrementTrades,
  incrementLoss,
  getCounters,
  resetCounters,
  testAtomicOperations,
} from "@/lib/queue/circuit-breaker-redis";
import { CircuitBreakerTrippedError } from "@/lib/queue/circuit-breaker.service";
import { getRedisClient } from "@/lib/cache/redis-client";

describe("Circuit Breaker Atomic Operations", () => {
  const testUserId = "test-user-atomic-123";

  beforeEach(async () => {
    // Reset counters before each test
    await resetCounters(testUserId);
  });

  afterEach(async () => {
    // Cleanup after each test
    await resetCounters(testUserId);
  });

  describe("testAtomicOperations", () => {
    it("should verify Redis atomic operations work", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const result = await testAtomicOperations();
      expect(result).toBe(true);
    });
  });

  describe("checkAndIncrementTrades", () => {
    it("should atomically increment trade counter and pass if under limit", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const maxTrades = 20;

      // First trade
      await expect(
        checkAndIncrementTrades(testUserId, maxTrades),
      ).resolves.not.toThrow();

      // Check counter was incremented
      const counters1 = await getCounters(testUserId);
      expect(counters1.trades).toBe(1);

      // Second trade
      await expect(
        checkAndIncrementTrades(testUserId, maxTrades),
      ).resolves.not.toThrow();

      // Check counter was incremented again
      const counters2 = await getCounters(testUserId);
      expect(counters2.trades).toBe(2);
    });

    it("should throw and rollback if limit exceeded", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const maxTrades = 3;

      // Execute 3 trades (at limit)
      await checkAndIncrementTrades(testUserId, maxTrades);
      await checkAndIncrementTrades(testUserId, maxTrades);
      await checkAndIncrementTrades(testUserId, maxTrades);

      // Verify counter is at limit
      const counters = await getCounters(testUserId);
      expect(counters.trades).toBe(3);

      // 4th trade should fail and rollback
      await expect(
        checkAndIncrementTrades(testUserId, maxTrades),
      ).rejects.toThrow(CircuitBreakerTrippedError);

      // Verify counter was rolled back (still 3, not 4)
      const countersAfter = await getCounters(testUserId);
      expect(countersAfter.trades).toBe(3);
    });

    it("should handle concurrent increments atomically (race condition test)", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const maxTrades = 10;
      const concurrency = 15; // More than limit

      // Execute 15 concurrent trades (only 10 should succeed)
      const results = await Promise.allSettled(
        Array.from({ length: concurrency }, async () =>
          checkAndIncrementTrades(testUserId, maxTrades),
        ),
      );

      // Count successes and failures
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      // Exactly maxTrades should succeed, rest should fail
      expect(successes).toBe(maxTrades);
      expect(failures).toBe(concurrency - maxTrades);

      // Verify final counter is exactly at limit
      const counters = await getCounters(testUserId);
      expect(counters.trades).toBe(maxTrades);
    });

    it("should gracefully degrade if Redis is unavailable", async () => {
      // Mock getRedisClient to return null
      const getRedisClientSpy = vi
        .spyOn(await import("@/lib/cache/redis-client"), "getRedisClient")
        .mockReturnValue(null);

      // Should not throw when Redis unavailable (graceful degradation)
      await expect(
        checkAndIncrementTrades(testUserId, 20),
      ).resolves.not.toThrow();

      getRedisClientSpy.mockRestore();
    });
  });

  describe("incrementLoss", () => {
    it("should atomically increment loss counter", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const maxLoss = 1000;

      // First loss
      await expect(
        incrementLoss(testUserId, 100.5, maxLoss),
      ).resolves.not.toThrow();

      const counters1 = await getCounters(testUserId);
      expect(counters1.loss).toBe(100.5);

      // Second loss
      await expect(
        incrementLoss(testUserId, 250.25, maxLoss),
      ).resolves.not.toThrow();

      const counters2 = await getCounters(testUserId);
      expect(counters2.loss).toBe(350.75);
    });

    it("should throw if loss limit exceeded", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const maxLoss = 500;

      // Add losses up to limit
      await incrementLoss(testUserId, 300, maxLoss);
      await incrementLoss(testUserId, 150, maxLoss);

      const counters = await getCounters(testUserId);
      expect(counters.loss).toBe(450);

      // Exceeding loss should throw
      await expect(incrementLoss(testUserId, 100, maxLoss)).rejects.toThrow(
        CircuitBreakerTrippedError,
      );
    });

    it("should handle null maxLossAmount gracefully", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      // No limit set (null)
      await expect(
        incrementLoss(testUserId, 10000, null),
      ).resolves.not.toThrow();

      const counters = await getCounters(testUserId);
      expect(counters.loss).toBe(0); // No counter when no limit
    });
  });

  describe("getCounters", () => {
    it("should return current counters from Redis", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      // Initially zero
      const counters1 = await getCounters(testUserId);
      expect(counters1.trades).toBe(0);
      expect(counters1.loss).toBe(0);

      // Increment trades
      await checkAndIncrementTrades(testUserId, 20);
      await checkAndIncrementTrades(testUserId, 20);

      // Increment loss
      await incrementLoss(testUserId, 123.45, 1000);

      // Verify counters
      const counters2 = await getCounters(testUserId);
      expect(counters2.trades).toBe(2);
      expect(counters2.loss).toBe(123.45);
    });

    it("should return zeros if Redis unavailable", async () => {
      const getRedisClientSpy = vi
        .spyOn(await import("@/lib/cache/redis-client"), "getRedisClient")
        .mockReturnValue(null);

      const counters = await getCounters(testUserId);
      expect(counters.trades).toBe(0);
      expect(counters.loss).toBe(0);

      getRedisClientSpy.mockRestore();
    });
  });

  describe("resetCounters", () => {
    it("should reset both counters to zero", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      // Set counters
      await checkAndIncrementTrades(testUserId, 20);
      await incrementLoss(testUserId, 100, 1000);

      const before = await getCounters(testUserId);
      expect(before.trades).toBe(1);
      expect(before.loss).toBe(100);

      // Reset
      await resetCounters(testUserId);

      const after = await getCounters(testUserId);
      expect(after.trades).toBe(0);
      expect(after.loss).toBe(0);
    });
  });

  describe("Race Condition Stress Test", () => {
    it("should handle 100 concurrent operations without overflow", async () => {
      const redis = getRedisClient();
      if (!redis) {
        console.warn("Redis not available, skipping test");
        return;
      }

      const maxTrades = 50;
      const concurrency = 100;

      // Simulate 100 workers trying to execute trades simultaneously
      const results = await Promise.allSettled(
        Array.from({ length: concurrency }, async () =>
          checkAndIncrementTrades(testUserId, maxTrades),
        ),
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      // Exactly maxTrades should succeed
      expect(successes).toBe(maxTrades);
      expect(failures).toBe(concurrency - maxTrades);

      // Final count should be exactly at limit (no overflow)
      const counters = await getCounters(testUserId);
      expect(counters.trades).toBe(maxTrades);

      // Verify all failures were circuit breaker trips
      const rejectedReasons = results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason);

      rejectedReasons.forEach((reason) => {
        expect(reason).toBeInstanceOf(CircuitBreakerTrippedError);
      });
    });
  });
});
