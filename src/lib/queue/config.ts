/**
 * BullMQ Queue Configuration
 *
 * Provides queue initialization and Redis connection for job processing.
 * Used for copy-trading automation with robust retry and circuit breaker integration.
 */

import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { logger } from "@/lib/logger";

/**
 * Redis connection options for BullMQ
 * Uses REDIS_URL from environment or falls back to local Redis
 */
export const getRedisConnection = (): ConnectionOptions => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn("REDIS_URL not configured, using local Redis (localhost:6379)");
    return {
      host: "localhost",
      port: 6379,
    };
  }

  // Parse Redis URL (format: redis://user:pass@host:port)
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
    };
  } catch (error) {
    logger.error("Failed to parse REDIS_URL, falling back to localhost", {
      error,
    });
    return {
      host: "localhost",
      port: 6379,
    };
  }
};

/**
 * Default BullMQ job options
 * - 3 attempts with exponential backoff
 * - 24h job retention after completion
 * - Remove failed jobs after 7 days
 */
export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000, // Start with 2s, then 4s, then 8s
  },
  removeOnComplete: {
    age: 24 * 3600, // Remove after 24h
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Remove after 7 days
  },
};

/**
 * Queue names used in the application
 */
export const QueueNames = {
  COPY_TRADES: "copy-trades",
  CIRCUIT_BREAKER_RESET: "circuit-breaker-reset",
} as const;

/**
 * Get or create BullMQ queue instance
 * Singleton pattern to avoid multiple queue instances
 */
const queues = new Map<string, Queue>();

export function getQueue<T = unknown>(
  queueName: string,
  options?: { connection?: ConnectionOptions },
): Queue<T> {
  const existing = queues.get(queueName);
  if (existing) {
    return existing as Queue<T>;
  }

  const connection = options?.connection ?? getRedisConnection();
  const queue = new Queue<T>(queueName, {
    connection,
    defaultJobOptions,
  });

  // Log queue events
  queue.on("error", (err) => {
    logger.error(`Queue ${queueName} error`, { error: err });
  });

  queues.set(queueName, queue);
  logger.info(`Queue ${queueName} initialized`);

  return queue;
}

/**
 * Create a worker for processing jobs
 * Worker runs independently and processes jobs from the queue
 */
export function createWorker<T = unknown>(
  queueName: string,
  processor: (job: { data: T; id?: string }) => Promise<void>,
  options?: {
    connection?: ConnectionOptions;
    concurrency?: number;
  },
): Worker<T> {
  const connection = options?.connection ?? getRedisConnection();
  const concurrency = options?.concurrency ?? 1;

  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
  });

  // Log worker events
  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed in queue ${queueName}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} failed in queue ${queueName}`, {
      error: err,
      jobData: job?.data,
    });
  });

  worker.on("error", (err) => {
    logger.error(`Worker error in queue ${queueName}`, { error: err });
  });

  logger.info(`Worker started for queue ${queueName}`, {
    concurrency,
  });

  return worker;
}

/**
 * Close all queues and workers
 * Use this for graceful shutdown
 */
export async function closeQueues(): Promise<void> {
  logger.info("Closing all queues...");
  const promises = Array.from(queues.values()).map(async (queue) =>
    queue.close(),
  );
  await Promise.all(promises);
  queues.clear();
  logger.info("All queues closed");
}
