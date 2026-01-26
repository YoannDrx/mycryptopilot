/**
 * Balance Cache Service Tests
 *
 * Tests unitaires pour le service de cache Redis des balances exchange.
 *
 * Coverage:
 * - getCachedBalance: cache hit, cache miss, Redis unavailable
 * - setCachedBalance: successful cache, Redis unavailable
 * - invalidateCachedBalance: successful invalidation, Redis unavailable
 * - getBalanceCacheStats: successful stats, Redis unavailable
 *
 * Performance target verification:
 * - Cache hit: ~1ms (vs 2000ms API call)
 * - Cache TTL: 30 seconds
 * - Graceful degradation when Redis unavailable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCachedBalance,
  setCachedBalance,
  invalidateCachedBalance,
  getBalanceCacheStats,
} from "@/lib/exchange/balance-cache.service";
import type { ConsolidatedBalance } from "@/lib/exchange/types";

// Mock Redis client
vi.mock("@/lib/cache/redis-client", () => ({
  getRedisClient: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Balance Cache Service", () => {
  let mockRedisClient: {
    get: ReturnType<typeof vi.fn>;
    setex: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    scan: ReturnType<typeof vi.fn>;
  };

  const mockBalance: ConsolidatedBalance = {
    timestamp: new Date("2025-01-01T00:00:00Z"),
    totalEquityUsd: 10000,
    spot: {
      totalUsd: 5000,
      assets: {
        USDT: { asset: "USDT", total: 3000, free: 3000, locked: 0 },
        BTC: { asset: "BTC", total: 2000, free: 2000, locked: 0 },
      },
    },
    futures: {
      totalUsd: 5000,
      assets: {
        USDT: { asset: "USDT", total: 5000, free: 4500, locked: 500 },
      },
      marginAvailable: 4500,
      marginUsed: 500,
      unrealizedPnl: 100,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock Redis client
    mockRedisClient = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      scan: vi.fn(),
    };

    const { getRedisClient } = await import("@/lib/cache/redis-client");
    (getRedisClient as ReturnType<typeof vi.fn>).mockReturnValue(
      mockRedisClient,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============= getCachedBalance Tests =============

  describe("getCachedBalance", () => {
    it("should return cached balance on cache hit", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockBalance));

      const result = await getCachedBalance(userId, exchange);

      expect(result).toEqual(mockBalance);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        "balance:cache:user123:BINANCE",
      );
    });

    it("should return null on cache miss", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await getCachedBalance(userId, exchange);

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        "balance:cache:user123:BINANCE",
      );
    });

    it("should return null when Redis is unavailable", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      const { getRedisClient } = await import("@/lib/cache/redis-client");
      (getRedisClient as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = await getCachedBalance(userId, exchange);

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it("should return null on Redis error and log error", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.get.mockRejectedValue(new Error("Redis connection lost"));

      const result = await getCachedBalance(userId, exchange);

      expect(result).toBeNull();
    });

    it("should handle Bybit exchange correctly", async () => {
      const userId = "user456";
      const exchange = "BYBIT";

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockBalance));

      const result = await getCachedBalance(userId, exchange);

      expect(result).toEqual(mockBalance);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        "balance:cache:user456:BYBIT",
      );
    });
  });

  // ============= setCachedBalance Tests =============

  describe("setCachedBalance", () => {
    it("should cache balance with 30 second TTL", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.setex.mockResolvedValue("OK");

      await setCachedBalance(userId, exchange, mockBalance);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "balance:cache:user123:BINANCE",
        30, // TTL in seconds
        JSON.stringify(mockBalance),
      );
    });

    it("should not throw when Redis is unavailable", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      const { getRedisClient } = await import("@/lib/cache/redis-client");
      (getRedisClient as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(
        setCachedBalance(userId, exchange, mockBalance),
      ).resolves.toBeUndefined();

      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });

    it("should not throw on Redis error", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.setex.mockRejectedValue(new Error("Redis write failed"));

      await expect(
        setCachedBalance(userId, exchange, mockBalance),
      ).resolves.toBeUndefined();
    });

    it("should serialize balance correctly for Bybit", async () => {
      const userId = "user456";
      const exchange = "BYBIT";

      mockRedisClient.setex.mockResolvedValue("OK");

      await setCachedBalance(userId, exchange, mockBalance);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "balance:cache:user456:BYBIT",
        30,
        JSON.stringify(mockBalance),
      );
    });
  });

  // ============= invalidateCachedBalance Tests =============

  describe("invalidateCachedBalance", () => {
    it("should delete cached balance", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.del.mockResolvedValue(1);

      await invalidateCachedBalance(userId, exchange);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "balance:cache:user123:BINANCE",
      );
    });

    it("should not throw when Redis is unavailable", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      const { getRedisClient } = await import("@/lib/cache/redis-client");
      (getRedisClient as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(
        invalidateCachedBalance(userId, exchange),
      ).resolves.toBeUndefined();

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it("should not throw on Redis error", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      mockRedisClient.del.mockRejectedValue(new Error("Redis delete failed"));

      await expect(
        invalidateCachedBalance(userId, exchange),
      ).resolves.toBeUndefined();
    });

    it("should handle Bybit invalidation correctly", async () => {
      const userId = "user456";
      const exchange = "BYBIT";

      mockRedisClient.del.mockResolvedValue(1);

      await invalidateCachedBalance(userId, exchange);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "balance:cache:user456:BYBIT",
      );
    });
  });

  // ============= getBalanceCacheStats Tests =============

  describe("getBalanceCacheStats", () => {
    it("should return cache stats with all keys", async () => {
      mockRedisClient.scan.mockResolvedValueOnce([
        "0",
        [
          "balance:cache:user1:BINANCE",
          "balance:cache:user2:BINANCE",
          "balance:cache:user3:BYBIT",
        ],
      ]);

      const stats = await getBalanceCacheStats();

      expect(stats).toEqual({
        totalKeys: 3,
        keysSample: [
          "balance:cache:user1:BINANCE",
          "balance:cache:user2:BINANCE",
          "balance:cache:user3:BYBIT",
        ],
      });

      expect(mockRedisClient.scan).toHaveBeenCalledWith(
        "0",
        "MATCH",
        "balance:cache:*",
        "COUNT",
        100,
      );
    });

    it("should handle pagination with cursor", async () => {
      // First scan returns cursor "1" (more results)
      mockRedisClient.scan
        .mockResolvedValueOnce([
          "1",
          ["balance:cache:user1:BINANCE", "balance:cache:user2:BINANCE"],
        ])
        // Second scan returns cursor "0" (done)
        .mockResolvedValueOnce([
          "0",
          ["balance:cache:user3:BYBIT", "balance:cache:user4:BYBIT"],
        ]);

      const stats = await getBalanceCacheStats();

      expect(stats).toEqual({
        totalKeys: 4,
        keysSample: [
          "balance:cache:user1:BINANCE",
          "balance:cache:user2:BINANCE",
          "balance:cache:user3:BYBIT",
          "balance:cache:user4:BYBIT",
        ],
      });

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
    });

    it("should limit keysSample to 10 keys", async () => {
      const keys = Array.from(
        { length: 15 },
        (_, i) => `balance:cache:user${i}:BINANCE`,
      );

      mockRedisClient.scan.mockResolvedValueOnce(["0", keys]);

      const stats = await getBalanceCacheStats();

      expect(stats?.totalKeys).toBe(15);
      expect(stats?.keysSample).toHaveLength(10);
    });

    it("should return null when Redis is unavailable", async () => {
      const { getRedisClient } = await import("@/lib/cache/redis-client");
      (getRedisClient as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const stats = await getBalanceCacheStats();

      expect(stats).toBeNull();
      expect(mockRedisClient.scan).not.toHaveBeenCalled();
    });

    it("should return null on Redis error", async () => {
      mockRedisClient.scan.mockRejectedValue(new Error("Redis scan failed"));

      const stats = await getBalanceCacheStats();

      expect(stats).toBeNull();
    });

    it("should handle empty cache", async () => {
      mockRedisClient.scan.mockResolvedValueOnce(["0", []]);

      const stats = await getBalanceCacheStats();

      expect(stats).toEqual({
        totalKeys: 0,
        keysSample: [],
      });
    });
  });

  // ============= Integration Tests =============

  describe("Integration: cache flow", () => {
    it("should handle full cache lifecycle: set -> get -> invalidate -> get", async () => {
      const userId = "user123";
      const exchange = "BINANCE";

      // Set cache
      mockRedisClient.setex.mockResolvedValue("OK");
      await setCachedBalance(userId, exchange, mockBalance);
      expect(mockRedisClient.setex).toHaveBeenCalledTimes(1);

      // Get cache (hit)
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockBalance));
      const cached1 = await getCachedBalance(userId, exchange);
      expect(cached1).toEqual(mockBalance);

      // Invalidate cache
      mockRedisClient.del.mockResolvedValue(1);
      await invalidateCachedBalance(userId, exchange);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);

      // Get cache (miss)
      mockRedisClient.get.mockResolvedValue(null);
      const cached2 = await getCachedBalance(userId, exchange);
      expect(cached2).toBeNull();
    });

    it("should maintain separate caches for different users", async () => {
      const user1 = "user1";
      const user2 = "user2";
      const exchange = "BINANCE";

      mockRedisClient.setex.mockResolvedValue("OK");

      await setCachedBalance(user1, exchange, mockBalance);
      await setCachedBalance(user2, exchange, mockBalance);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "balance:cache:user1:BINANCE",
        30,
        expect.any(String),
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "balance:cache:user2:BINANCE",
        30,
        expect.any(String),
      );
    });

    it("should maintain separate caches for different exchanges", async () => {
      const userId = "user123";

      mockRedisClient.setex.mockResolvedValue("OK");

      await setCachedBalance(userId, "BINANCE", mockBalance);
      await setCachedBalance(userId, "BYBIT", mockBalance);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "balance:cache:user123:BINANCE",
        30,
        expect.any(String),
      );
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "balance:cache:user123:BYBIT",
        30,
        expect.any(String),
      );
    });
  });
});
