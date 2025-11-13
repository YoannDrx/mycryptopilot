import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  publishBalanceUpdate,
  subscribeToBalanceUpdates,
  testRedisPubSub,
  BALANCE_CHANNEL_PREFIX,
} from "@/lib/redis/redis-pubsub";
import type { ConsolidatedBalance } from "@/lib/exchange/types";

// Mock Redis client
const mockRedisClient = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  quit: vi.fn(),
};

// Mock Redis constructor
const MockRedis = vi.fn(() => mockRedisClient);

// Mock getRedisClient
const getRedisClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/cache/redis-client", () => ({
  getRedisClient: getRedisClientMock,
}));

// Mock logger
const loggerSpy = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: loggerSpy,
}));

// Mock ioredis
vi.mock("ioredis", () => ({
  default: MockRedis,
}));

describe("Redis Pub/Sub", () => {
  const mockBalance: ConsolidatedBalance = {
    timestamp: new Date("2025-01-01T00:00:00Z"),
    totalEquityUsd: 10000,
    spot: {
      totalUsd: 5000,
      assets: {
        USDT: {
          asset: "USDT",
          free: 4000,
          locked: 1000,
          total: 5000,
          usdValue: 5000,
        },
      },
    },
    futures: {
      totalUsd: 5000,
      assets: {
        USDT: {
          asset: "USDT",
          free: 3000,
          locked: 2000,
          total: 5000,
          usdValue: 5000,
        },
      },
      marginUsed: 2000,
      marginAvailable: 3000,
      unrealizedPnl: 500,
      leverage: 10,
    },
  };

  const traderId = "trader_123";

  beforeEach(() => {
    vi.clearAllMocks();
    getRedisClientMock.mockReturnValue(mockRedisClient);
    mockRedisClient.publish.mockResolvedValue(1); // 1 subscriber received
    mockRedisClient.subscribe.mockResolvedValue(undefined);
    mockRedisClient.unsubscribe.mockResolvedValue(undefined);
    mockRedisClient.quit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("publishBalanceUpdate", () => {
    it("publishes balance update to Redis channel", async () => {
      const result = await publishBalanceUpdate(traderId, mockBalance);

      expect(result).toBe(true);
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        `${BALANCE_CHANNEL_PREFIX}${traderId}`,
        expect.stringContaining('"type":"balance"'),
      );

      // Verify message structure
      const publishCalls = mockRedisClient.publish.mock.calls;
      expect(publishCalls).toHaveLength(1);
      const [, payload] = publishCalls[0] as [string, string];
      const message = JSON.parse(payload);
      expect(message).toMatchObject({
        type: "balance",
        traderId,
        balance: expect.objectContaining({
          totalEquityUsd: 10000,
        }),
        timestamp: expect.any(String),
      });

      expect(loggerSpy.debug).toHaveBeenCalledWith(
        "Balance update published to Redis",
        expect.objectContaining({
          traderId,
          subscriberCount: 1,
        }),
      );
    });

    it("returns false if Redis is not available", async () => {
      getRedisClientMock.mockReturnValue(null);

      const result = await publishBalanceUpdate(traderId, mockBalance);

      expect(result).toBe(false);
      expect(mockRedisClient.publish).not.toHaveBeenCalled();
      expect(loggerSpy.warn).toHaveBeenCalledWith(
        "Redis not available, balance update not published",
        { traderId },
      );
    });

    it("handles publish errors gracefully", async () => {
      mockRedisClient.publish.mockRejectedValue(new Error("Connection lost"));

      const result = await publishBalanceUpdate(traderId, mockBalance);

      expect(result).toBe(false);
      expect(loggerSpy.error).toHaveBeenCalledWith(
        "Failed to publish balance update to Redis",
        expect.objectContaining({
          traderId,
          error: "Connection lost",
        }),
      );
    });
  });

  describe("subscribeToBalanceUpdates", () => {
    it("subscribes to Redis channel and receives updates", async () => {
      const mockCallback = vi.fn();
      const handlers: ((channel: string, message: string) => void)[] = [];

      // Capture the message handler when it's registered
      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === "message") {
          handlers.push(handler as (channel: string, message: string) => void);
        }
        return mockRedisClient;
      });

      // Mock environment variable
      process.env.REDIS_URL = "redis://localhost:6379";

      const subscription = await subscribeToBalanceUpdates(
        traderId,
        mockCallback,
      );

      expect(subscription).toMatchObject({
        traderId,
        channel: `${BALANCE_CHANNEL_PREFIX}${traderId}`,
        unsubscribe: expect.any(Function),
      });

      expect(mockRedisClient.subscribe).toHaveBeenCalledWith(
        `${BALANCE_CHANNEL_PREFIX}${traderId}`,
      );

      expect(loggerSpy.info).toHaveBeenCalledWith(
        "Subscribed to balance updates via Redis",
        expect.objectContaining({
          traderId,
        }),
      );

      // Simulate receiving a message
      const testMessage = {
        type: "balance" as const,
        traderId,
        balance: mockBalance,
        timestamp: new Date().toISOString(),
      };

      // Call the registered handler
      handlers[0]?.(
        `${BALANCE_CHANNEL_PREFIX}${traderId}`,
        JSON.stringify(testMessage),
      );

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "balance",
          traderId,
        }),
      );
    });

    it("ignores messages from other channels", async () => {
      const mockCallback = vi.fn();
      const handlers: ((channel: string, message: string) => void)[] = [];

      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === "message") {
          handlers.push(handler as (channel: string, message: string) => void);
        }
        return mockRedisClient;
      });

      process.env.REDIS_URL = "redis://localhost:6379";

      await subscribeToBalanceUpdates(traderId, mockCallback);

      // Simulate message from different channel
      const testMessage = {
        type: "balance" as const,
        traderId: "different_trader",
        balance: mockBalance,
        timestamp: new Date().toISOString(),
      };

      handlers[0]?.(
        `${BALANCE_CHANNEL_PREFIX}different_trader`,
        JSON.stringify(testMessage),
      );

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("handles malformed messages gracefully", async () => {
      const mockCallback = vi.fn();
      const handlers: ((channel: string, message: string) => void)[] = [];

      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === "message") {
          handlers.push(handler as (channel: string, message: string) => void);
        }
        return mockRedisClient;
      });

      process.env.REDIS_URL = "redis://localhost:6379";

      await subscribeToBalanceUpdates(traderId, mockCallback);

      // Send malformed message
      handlers[0]?.(`${BALANCE_CHANNEL_PREFIX}${traderId}`, "invalid json{{{");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(loggerSpy.error).toHaveBeenCalledWith(
        "Failed to parse balance update message",
        expect.objectContaining({
          traderId,
        }),
      );
    });

    it("unsubscribes and cleans up properly", async () => {
      const mockCallback = vi.fn();
      const handlers: ((channel: string, message: string) => void)[] = [];

      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === "message") {
          handlers.push(handler as (channel: string, message: string) => void);
        }
        return mockRedisClient;
      });

      process.env.REDIS_URL = "redis://localhost:6379";

      const subscription = await subscribeToBalanceUpdates(
        traderId,
        mockCallback,
      );

      await subscription.unsubscribe();

      expect(mockRedisClient.unsubscribe).toHaveBeenCalledWith(
        `${BALANCE_CHANNEL_PREFIX}${traderId}`,
      );
      expect(mockRedisClient.off).toHaveBeenCalledWith("message", handlers[0]);
      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        "Unsubscribed from balance updates",
        expect.objectContaining({
          traderId,
        }),
      );
    });

    it("handles unsubscribe errors gracefully", async () => {
      const mockCallback = vi.fn();

      mockRedisClient.on.mockReturnValue(mockRedisClient);
      mockRedisClient.unsubscribe.mockRejectedValue(
        new Error("Connection closed"),
      );

      process.env.REDIS_URL = "redis://localhost:6379";

      const subscription = await subscribeToBalanceUpdates(
        traderId,
        mockCallback,
      );

      await subscription.unsubscribe();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        "Failed to unsubscribe from balance updates",
        expect.objectContaining({
          traderId,
          error: expect.any(Error),
        }),
      );
    });

    it("throws error if REDIS_URL not configured", async () => {
      const mockCallback = vi.fn();
      delete process.env.REDIS_URL;

      await expect(
        subscribeToBalanceUpdates(traderId, mockCallback),
      ).rejects.toThrow("REDIS_URL not configured");
    });
  });

  describe("testRedisPubSub", () => {
    it("returns true when pub/sub is working", async () => {
      let messageHandler: ((channel: string, message: string) => void) | null =
        null;

      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
          // Immediately trigger the message to simulate successful pub/sub
          setTimeout(() => {
            if (messageHandler) {
              messageHandler(
                "test:pubsub",
                JSON.stringify({ test: true, timestamp: Date.now() }),
              );
            }
          }, 0);
        }
        return mockRedisClient;
      });

      process.env.REDIS_URL = "redis://localhost:6379";

      const result = await testRedisPubSub();

      expect(result).toBe(true);
    });

    it("returns false when Redis is not available", async () => {
      getRedisClientMock.mockReturnValue(null);
      process.env.REDIS_URL = "redis://localhost:6379";

      const result = await testRedisPubSub();

      expect(result).toBe(false);
    });

    it("returns false when REDIS_URL is not configured", async () => {
      delete process.env.REDIS_URL;

      const result = await testRedisPubSub();

      expect(result).toBe(false);
    });

    it("handles test errors gracefully", async () => {
      mockRedisClient.subscribe.mockRejectedValue(
        new Error("Connection failed"),
      );
      process.env.REDIS_URL = "redis://localhost:6379";

      const result = await testRedisPubSub();

      expect(result).toBe(false);
      // Error is logged in the subscription creation code, not the test function itself
      expect(loggerSpy.error).toHaveBeenCalledWith(
        "Failed to create test subscriber",
        expect.objectContaining({
          error: expect.any(Error),
        }),
      );
    });
  });
});
