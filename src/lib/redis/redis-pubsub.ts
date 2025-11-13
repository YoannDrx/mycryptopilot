/**
 * Redis Pub/Sub Service
 *
 * Cross-process pub/sub using Redis for real-time balance updates.
 * Replaces EventEmitter to work across Fly worker and Vercel serverless.
 *
 * Architecture:
 * - Publisher: Fly worker publishes balance updates to Redis channels
 * - Subscriber: Vercel SSE routes subscribe to Redis channels
 * - Channels: balance:{traderId} for trader-specific updates
 *
 * Features:
 * - Cross-process communication (Fly ↔ Vercel)
 * - Automatic reconnection
 * - Type-safe message format
 * - Error handling with retries
 * - Graceful degradation if Redis unavailable
 *
 * @example
 * // Publisher (Fly worker)
 * await publishBalanceUpdate(traderId, balance);
 *
 * // Subscriber (SSE route)
 * const subscriber = await subscribeToBalanceUpdates(traderId, (balance) => {
 *   console.log('Balance updated:', balance);
 * });
 * // Later: subscriber.unsubscribe()
 */

import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/cache/redis-client";
import type { ConsolidatedBalance } from "@/lib/exchange/types";

// ============= Constants =============

/**
 * Redis channel pattern for balance updates
 * Format: balance:{traderId}
 */
export const BALANCE_CHANNEL_PREFIX = "balance:";

/**
 * Message types published to Redis channels
 */
export type BalanceUpdateMessage = {
  type: "balance";
  traderId: string;
  balance: ConsolidatedBalance;
  timestamp: string; // ISO 8601
};

// ============= Publisher =============

/**
 * Publish balance update to Redis channel
 *
 * Called by Fly worker when balance is polled.
 * Publishes to channel: balance:{traderId}
 *
 * @param traderId - Trader ID
 * @param balance - Consolidated balance data
 * @returns True if published successfully
 *
 * @example
 * const balance = await adapter.fetchConsolidatedBalance();
 * await publishBalanceUpdate(traderId, balance);
 */
export async function publishBalanceUpdate(
  traderId: string,
  balance: ConsolidatedBalance,
): Promise<boolean> {
  const redis = getRedisClient();

  // Graceful degradation if Redis not available
  if (!redis) {
    logger.warn("Redis not available, balance update not published", {
      traderId,
    });
    return false;
  }

  try {
    const message: BalanceUpdateMessage = {
      type: "balance",
      traderId,
      balance,
      timestamp: new Date().toISOString(),
    };

    const channel = `${BALANCE_CHANNEL_PREFIX}${traderId}`;
    const payload = JSON.stringify(message);

    // Publish to Redis channel
    // Returns number of subscribers that received the message
    const subscriberCount = await redis.publish(channel, payload);

    logger.debug("Balance update published to Redis", {
      traderId,
      channel,
      subscriberCount,
      totalEquityUsd: balance.totalEquityUsd,
    });

    return true;
  } catch (error) {
    logger.error("Failed to publish balance update to Redis", {
      traderId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// ============= Subscriber =============

/**
 * Subscription handle
 * Used to unsubscribe and cleanup
 */
export type BalanceSubscription = {
  traderId: string;
  channel: string;
  unsubscribe: () => Promise<void>;
};

/**
 * Subscribe to balance updates for a trader
 *
 * Called by SSE routes to receive real-time balance updates.
 * Listens to channel: balance:{traderId}
 *
 * @param traderId - Trader ID to subscribe to
 * @param onUpdate - Callback invoked when balance updates
 * @returns Subscription handle (call .unsubscribe() to cleanup)
 *
 * @example
 * const sub = await subscribeToBalanceUpdates(traderId, (message) => {
 *   console.log('Balance updated:', message.balance);
 *   sendSSEMessage(message);
 * });
 * // Later...
 * await sub.unsubscribe();
 */
export async function subscribeToBalanceUpdates(
  traderId: string,
  onUpdate: (message: BalanceUpdateMessage) => void,
): Promise<BalanceSubscription> {
  // Create separate Redis client for subscriber
  // IMPORTANT: Subscribers need dedicated connection (can't use same client)
  const Redis = await import("ioredis").then((m) => m.default);

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL not configured");
  }

  const subscriber = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Important for pub/sub
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error("Redis subscriber connection failed after 10 retries");
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      logger.warn(
        `Redis subscriber reconnecting in ${delay}ms (attempt ${times})`,
      );
      return delay;
    },
  });

  const channel = `${BALANCE_CHANNEL_PREFIX}${traderId}`;

  // Message handler
  const messageHandler = (receivedChannel: string, message: string) => {
    // Only handle messages for this trader's channel
    if (receivedChannel !== channel) {
      return;
    }

    try {
      const parsed = JSON.parse(message) as BalanceUpdateMessage;

      logger.debug("Balance update received from Redis", {
        traderId,
        channel: receivedChannel,
        timestamp: parsed.timestamp,
      });

      onUpdate(parsed);
    } catch (error) {
      logger.error("Failed to parse balance update message", {
        traderId,
        channel: receivedChannel,
        error,
      });
    }
  };

  // Subscribe to channel
  subscriber.on("message", messageHandler);

  await subscriber.subscribe(channel);

  logger.info("Subscribed to balance updates via Redis", {
    traderId,
    channel,
  });

  // Return subscription handle
  return {
    traderId,
    channel,
    unsubscribe: async () => {
      logger.info("Unsubscribing from balance updates", {
        traderId,
        channel,
      });

      try {
        await subscriber.unsubscribe(channel);
        subscriber.off("message", messageHandler);
        await subscriber.quit();

        logger.debug("Unsubscribed from balance updates", {
          traderId,
          channel,
        });
      } catch (error) {
        logger.error("Failed to unsubscribe from balance updates", {
          traderId,
          channel,
          error,
        });
      }
    },
  };
}

// ============= Health Check =============

/**
 * Test Redis pub/sub connectivity
 *
 * Publishes a test message and verifies it's received.
 * Useful for health checks and diagnostics.
 *
 * @returns True if pub/sub is working
 */
export async function testRedisPubSub(): Promise<boolean> {
  try {
    const testChannel = "test:pubsub";
    const testMessage = { test: true, timestamp: Date.now() };

    let messageReceived = false;

    // Create subscriber
    const subscription = await new Promise<BalanceSubscription | null>(
      (resolve) => {
        void (async () => {
          try {
            const Redis = await import("ioredis").then((m) => m.default);

            if (!process.env.REDIS_URL) {
              resolve(null);
              return;
            }

            const subscriber = new Redis(process.env.REDIS_URL);

            subscriber.on("message", (channel, message) => {
              if (channel === testChannel) {
                const parsed = JSON.parse(message);
                if (parsed.test === true) {
                  messageReceived = true;
                }
              }
            });

            await subscriber.subscribe(testChannel);

            resolve({
              traderId: "test",
              channel: testChannel,
              unsubscribe: async () => {
                await subscriber.unsubscribe(testChannel);
                await subscriber.quit();
              },
            });
          } catch (error) {
            logger.error("Failed to create test subscriber", { error });
            resolve(null);
          }
        })();
      },
    );

    if (!subscription) {
      return false;
    }

    // Wait a bit for subscription to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Publish test message
    const redis = getRedisClient();
    if (!redis) {
      await subscription.unsubscribe();
      return false;
    }

    await redis.publish(testChannel, JSON.stringify(testMessage));

    // Wait for message
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Cleanup
    await subscription.unsubscribe();

    return messageReceived;
  } catch (error) {
    logger.error("Redis pub/sub test failed", { error });
    return false;
  }
}
