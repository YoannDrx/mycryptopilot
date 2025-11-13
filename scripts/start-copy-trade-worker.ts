#!/usr/bin/env tsx

/**
 * Start Copy Trade Worker
 *
 * Starts the BullMQ worker that processes copy-trade jobs.
 * This script should run as a separate process (e.g., on Fly.io worker).
 *
 * Usage:
 * - Development: tsx scripts/start-copy-trade-worker.ts
 * - Production: node dist/scripts/start-copy-trade-worker.js
 *
 * Environment Variables Required:
 * - REDIS_URL: Redis connection URL for BullMQ
 * - DATABASE_URL: PostgreSQL connection for Prisma
 * - ENCRYPTION_SECRET: For decrypting API keys
 * - All exchange API environment variables (if needed)
 *
 * Graceful Shutdown:
 * - SIGTERM: Waits for active jobs to complete before exiting
 * - SIGINT: Same as SIGTERM (Ctrl+C)
 */

import {
  startCopyTradeWorker,
  stopCopyTradeWorker,
} from "@/lib/queue/copy-trade-worker";
import { logger } from "@/lib/logger";

// Track worker instance for graceful shutdown
let worker: ReturnType<typeof startCopyTradeWorker> | null = null;

/**
 * Start the worker
 */
async function start() {
  try {
    logger.info("Starting copy trade worker process...");

    // Validate required environment variables
    const requiredEnvVars = ["REDIS_URL", "DATABASE_URL", "ENCRYPTION_SECRET"];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Start worker
    worker = startCopyTradeWorker();

    logger.info("Copy trade worker process started successfully");
    logger.info("Worker is now listening for copy trade jobs...");
    logger.info("Press Ctrl+C to stop");
  } catch (error) {
    logger.error("Failed to start copy trade worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  if (!worker) {
    logger.warn("No worker instance found, exiting immediately");
    process.exit(0);
    return;
  }

  try {
    // Stop accepting new jobs and wait for active jobs to complete
    await stopCopyTradeWorker(worker);

    logger.info("Copy trade worker stopped successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Handle uncaught errors
 */
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

/**
 * Handle shutdown signals
 */
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

/**
 * Start the worker
 */
void start();
