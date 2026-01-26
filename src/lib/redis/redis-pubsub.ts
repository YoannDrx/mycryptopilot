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
import type Redis from "ioredis";

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

let sharedSubscriber: Redis | null = null;
const channelHandlers = new Map<
  string,
  Set<(message: BalanceUpdateMessage) => void>
>();
let subscriberListening = false;

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
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL not configured");
  }

  const subscriber = await getSharedSubscriber();
  const channel = `${BALANCE_CHANNEL_PREFIX}${traderId}`;

  let handlers = channelHandlers.get(channel);
  if (!handlers) {
    handlers = new Set();
    channelHandlers.set(channel, handlers);
    await subscriber.subscribe(channel);
    logger.debug("Subscribed to Redis channel", { channel });
  }

  const handler = (message: BalanceUpdateMessage) => onUpdate(message);
  handlers.add(handler);

  if (!subscriberListening) {
    subscriber.on("message", (receivedChannel: string, payload: string) => {
      const listeners = channelHandlers.get(receivedChannel);
      if (!listeners || listeners.size === 0) {
        return;
      }

      try {
        const parsed = JSON.parse(payload) as BalanceUpdateMessage;
        listeners.forEach((listener) => listener(parsed));
      } catch (error) {
        logger.error("Failed to parse balance update message", {
          channel: receivedChannel,
          error,
        });
      }
    });

    subscriberListening = true;
  }

  return {
    traderId,
    channel,
    unsubscribe: async () => {
      const channelSet = channelHandlers.get(channel);
      if (!channelSet) {
        return;
      }

      channelSet.delete(handler);

      if (channelSet.size === 0) {
        channelHandlers.delete(channel);
        try {
          await subscriber.unsubscribe(channel);
        } catch (error) {
          logger.error("Failed to unsubscribe Redis channel", {
            traderId,
            channel,
            error,
          });
        }
      }
    },
  };
}

export async function resetRedisSubscriberForTests(): Promise<void> {
  channelHandlers.clear();
  if (sharedSubscriber) {
    await sharedSubscriber.quit();
    sharedSubscriber = null;
  }
  subscriberListening = false;
}

async function getSharedSubscriber(): Promise<Redis> {
  if (sharedSubscriber) {
    return sharedSubscriber;
  }

  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL not configured");
  }

  const { default: RedisLib } = await import("ioredis");
  sharedSubscriber = new RedisLib(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error("Redis subscriber failed after repeated retries");
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });

  return sharedSubscriber;
}

export function getRedisSubscriberStats(): {
  channels: number;
  totalHandlers: number;
} {
  let totalHandlers = 0;
  channelHandlers.forEach((handlers) => {
    totalHandlers += handlers.size;
  });

  return {
    channels: channelHandlers.size,
    totalHandlers,
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
