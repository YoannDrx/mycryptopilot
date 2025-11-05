/**
 * Redis Client
 *
 * Singleton Redis client for caching.
 * Uses ioredis for Redis connection.
 */

import { logger } from "@/lib/logger";

// Redis client singleton
// Using type 'any' for Redis since ioredis may not be installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any | null = null;

/**
 * Get or create Redis client
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRedisClient(): any | null {
  // If Redis is not configured, return null (graceful degradation)
  if (!process.env.REDIS_URL) {
    logger.warn("Redis URL not configured, caching disabled");
    return null;
  }

  // Return existing client
  if (redisClient) {
    return redisClient;
  }

  try {
    // Try to dynamically import ioredis
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis");

    // Create new Redis client
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error("Redis connection failed after 3 retries");
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Exponential backoff
      },
      reconnectOnError: (err: Error) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    });

    // Log connection events
    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });

    redisClient.on("error", (err: Error) => {
      logger.error("Redis client error", { error: err.message });
    });

    redisClient.on("close", () => {
      logger.warn("Redis client connection closed");
    });

    return redisClient;
  } catch (error) {
    logger.error(
      "Failed to create Redis client - ioredis may not be installed",
      { error },
    );
    return null;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client disconnected");
  }
}

/**
 * Ping Redis to check connection
 */
export async function pingRedis(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const response = await client.ping();
    return response === "PONG";
  } catch {
    return false;
  }
}
