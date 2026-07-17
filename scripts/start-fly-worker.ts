#!/usr/bin/env tsx

/**
 * Fly.io background worker entrypoint.
 *
 * Responsibilities:
 * - Run exchange sync cron every 5 minutes
 * It intentionally runs only read-only exchange synchronization.
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Load local environment variables when not running in production
if (process.env.NODE_ENV !== "production") {
  const cwd = process.cwd();
  const candidateFiles = [
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env.development"),
    path.join(cwd, ".env"),
  ];

  const envPath = candidateFiles.find((filePath) => fs.existsSync(filePath));

  if (envPath) {
    dotenv.config({ path: envPath, override: false });
    // eslint-disable-next-line no-console
    console.log(`Loaded environment from ${path.basename(envPath)}`);
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      "No local .env file found for Fly worker (expected .env.local or .env.development)",
    );
  }
}

import { logger } from "../src/lib/logger";
import { runExchangeSyncCronJob } from "../src/lib/cron/exchange-sync-job";

type JobHandler<T = unknown> = () => Promise<{ success?: boolean } & T>;

async function executeJob(name: string, handler: JobHandler) {
  const startedAt = Date.now();

  try {
    const result = await handler();

    if (result.success === false) {
      logger.error(`${name} job reported failure`, { result });
    } else {
      logger.info(`${name} job completed`, {
        durationMs: Date.now() - startedAt,
        result,
      });
    }
  } catch (error) {
    logger.error(`${name} job crashed`, {
      error,
      durationMs: Date.now() - startedAt,
    });
  }
}

function scheduleIntervalJob(
  name: string,
  intervalMs: number,
  handler: JobHandler,
) {
  let running = false;

  const tick = async () => {
    if (running) {
      logger.warn(`${name} job skipped because previous run is still active`);
      return;
    }

    running = true;
    try {
      await executeJob(name, handler);
    } finally {
      running = false;
    }
  };

  logger.info(`Scheduling ${name} job every ${intervalMs / 1000}s`);
  void tick(); // Run immediately
  setInterval(() => {
    void tick();
  }, intervalMs);
}

async function main() {
  logger.info("Starting read-only MyCryptoPilot background worker");

  // High-frequency cron
  scheduleIntervalJob("exchange-sync", 5 * 60 * 1000, runExchangeSyncCronJob);

  // Graceful shutdown for Fly machines
  const shutdown = async () => {
    logger.info("Shutting down Fly worker (received signal)");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection in Fly worker", { reason });
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception in Fly worker", { error });
    process.exit(1);
  });
}

void main();
