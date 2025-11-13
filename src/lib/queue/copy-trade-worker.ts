/**
 * Copy Trade Worker
 *
 * Processes copy trade jobs from the BullMQ queue.
 * Executes trades on user exchanges with circuit breaker protection.
 *
 * Flow:
 * 1. Receive job from queue
 * 2. Check circuit breaker (risk limits)
 * 3. Decrypt exchange credentials
 * 4. Execute order via exchange API
 * 5. Update CopyTrade record with result
 * 6. Increment circuit breaker counters
 *
 * Error Handling:
 * - Circuit breaker tripped -> Fail job immediately (no retry)
 * - Exchange error -> Retry with exponential backoff
 * - Network error -> Retry with exponential backoff
 * - Invalid credentials -> Fail job immediately (no retry)
 *
 * @example
 * // Start worker in separate process (e.g., scripts/start-copy-trade-worker.ts)
 * const worker = startCopyTradeWorker();
 * worker.on('completed', (job) => console.log('Job completed:', job.id));
 */

import type { Worker } from "bullmq";
import { createWorker } from "./config";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  checkCircuitBreaker,
  incrementTradeCounter,
  recordLoss,
  CircuitBreakerTrippedError,
} from "./circuit-breaker.service";
import type { CopyTradeJobData, CopyTradeJobResult } from "./copy-trade-jobs";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import { decryptApiKey } from "@/lib/crypto/encryption-service";
import {
  executeCopyTrade,
  failCopyTrade,
} from "@/lib/trading/copy-trade.service";

// ============= Worker Configuration =============

/**
 * Worker concurrency
 * Number of jobs processed simultaneously
 * Low concurrency to avoid rate limits and ensure proper circuit breaker checks
 */
const WORKER_CONCURRENCY = 2;

/**
 * Job timeout (milliseconds)
 * Max time for a single job execution
 */
const JOB_TIMEOUT = 60000; // 60 seconds

// ============= Job Processor =============

/**
 * Main job processor function
 * Called by BullMQ worker for each queued job
 */
async function processCopyTradeJob(job: {
  data: CopyTradeJobData;
  id?: string;
}): Promise<CopyTradeJobResult> {
  const { data } = job;
  const { userId, copyTradeId, symbol, side, orderType, quantity, exchangeId } =
    data;

  logger.info("Processing copy trade job", {
    jobId: job.id,
    copyTradeId,
    userId,
    symbol,
    side,
    quantity,
  });

  try {
    // ========== Step 1: Circuit Breaker Check ==========
    logger.debug("Checking circuit breaker", { userId });

    try {
      await checkCircuitBreaker(userId);
    } catch (error) {
      if (error instanceof CircuitBreakerTrippedError) {
        logger.warn("Circuit breaker tripped - failing job", {
          userId,
          reason: error.reason,
        });

        // Mark copy trade as failed
        await failCopyTrade(
          copyTradeId,
          `Circuit breaker tripped: ${error.reason}`,
          "CIRCUIT_BREAKER_TRIPPED",
          JSON.stringify({ reason: error.reason, userId }, null, 2),
        );

        // Throw non-retryable error (BullMQ won't retry)
        throw new Error(`CIRCUIT_BREAKER_TRIPPED: ${error.reason}`);
      }
      throw error;
    }

    // ========== Step 2: Get Exchange Connection ==========
    logger.debug("Fetching exchange connection", { exchangeId });

    const exchangeConnection = await prisma.userExchangeConnection.findUnique({
      where: { id: exchangeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!exchangeConnection) {
      logger.error("Exchange connection not found", { exchangeId });
      await failCopyTrade(
        copyTradeId,
        "Exchange connection not found",
        "EXCHANGE_CONNECTION_NOT_FOUND",
        JSON.stringify({ exchangeId }, null, 2),
      );
      throw new Error("EXCHANGE_CONNECTION_NOT_FOUND");
    }

    if (!exchangeConnection.isActive) {
      logger.error("Exchange connection is not active", { exchangeId });
      await failCopyTrade(
        copyTradeId,
        "Exchange connection is not active",
        "EXCHANGE_CONNECTION_INACTIVE",
        JSON.stringify({ exchangeId, userId }, null, 2),
      );
      throw new Error("EXCHANGE_CONNECTION_INACTIVE");
    }

    // ========== Step 3: Decrypt API Credentials ==========
    logger.debug("Decrypting API credentials");

    const apiKey = decryptApiKey(
      exchangeConnection.encryptedApiKey,
      exchangeConnection.keyIv,
      exchangeConnection.keyTag,
    );
    const secretKey = decryptApiKey(
      exchangeConnection.encryptedSecretKey,
      exchangeConnection.keyIv,
      exchangeConnection.keyTag,
    );

    // ========== Step 4: Create Exchange Service ==========
    logger.debug("Creating exchange service", {
      exchange: exchangeConnection.exchange,
    });

    const exchangeService = createExchangeService(
      exchangeConnection.exchange,
      apiKey,
      secretKey,
    );

    // ========== Step 5: Execute Order ==========
    logger.info("Executing order on exchange", {
      symbol,
      side,
      orderType,
      quantity,
      exchange: exchangeConnection.exchange,
    });

    const orderResult = await exchangeService.createOrder({
      symbol,
      side,
      type: orderType,
      quantity,
      price: data.limitPrice,
      clientOrderId: copyTradeId, // Use copyTradeId as clientOrderId for tracking
      instrumentType: data.instrumentType === "PERP" ? "FUTURES_USDT" : "SPOT", // ✅ Use instrumentType from job data (PERP -> FUTURES_USDT)
      timeInForce: orderType === "LIMIT" ? "GTC" : undefined,
    });

    logger.info("Order executed successfully", {
      copyTradeId,
      orderId: orderResult.orderId,
      executedQty: orderResult.executedQty,
      executedPrice: orderResult.executedPrice,
      status: orderResult.status,
    });

    // ========== Step 6: Update CopyTrade Record ==========
    logger.debug("Updating copy trade record", { copyTradeId });

    // Calculate actual execution values
    const executedPrice = orderResult.executedPrice;
    const executedQuantity = orderResult.executedQty;

    // Calculate slippage if limit price was set
    let slippage = 0;
    if (data.limitPrice && executedPrice > 0) {
      slippage = ((executedPrice - data.limitPrice) / data.limitPrice) * 100;
    }

    await executeCopyTrade({
      copyTradeId,
      exchangeOrderId: orderResult.orderId,
      executedPrice,
      executedQuantity,
      slippage,
    });

    // ========== Step 7: Update Circuit Breaker Counters ==========
    logger.debug("Updating circuit breaker counters", { userId });

    // Increment trade counter
    await incrementTradeCounter(userId);

    // If trade resulted in a loss, record it
    // Note: We can't calculate PnL immediately for open positions
    // This would be calculated when position is closed
    // For now, we just track execution

    // ========== Step 8: Cleanup ==========
    await exchangeService.close();

    const result: CopyTradeJobResult = {
      copyTradeId,
      exchangeOrderId: orderResult.orderId,
      executedPrice,
      executedQuantity,
      slippage,
      executedAt: new Date(orderResult.transactTime),
    };

    logger.info("Copy trade job completed successfully", {
      jobId: job.id,
      copyTradeId,
      result,
    });

    return result;
  } catch (error) {
    logger.error("Copy trade job failed", {
      jobId: job.id,
      copyTradeId,
      error,
    });

    // Determine if error is retryable
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error
        ? (error.stack ?? "No stack trace")
        : "No stack trace";

    // Extract error code from message (format: "ERROR_CODE: description")
    const errorCodeMatch = errorMessage.match(/^([A-Z_]+):/);
    const errorCode = errorCodeMatch?.[1] ?? "UNKNOWN_ERROR";

    // Non-retryable errors
    if (
      errorMessage.includes("CIRCUIT_BREAKER_TRIPPED") ||
      errorMessage.includes("EXCHANGE_CONNECTION_NOT_FOUND") ||
      errorMessage.includes("EXCHANGE_CONNECTION_INACTIVE") ||
      errorMessage.includes("INVALID_API_KEY") ||
      errorMessage.includes("INSUFFICIENT_BALANCE")
    ) {
      logger.warn("Non-retryable error - will not retry", {
        copyTradeId,
        error: errorMessage,
        errorCode,
      });

      // Don't throw - job will be marked as failed without retry
      await failCopyTrade(
        copyTradeId,
        errorMessage,
        errorCode,
        JSON.stringify(
          {
            message: errorMessage,
            stack: errorStack,
            jobId: job.id,
          },
          null,
          2,
        ),
      );
      throw new Error(errorMessage);
    }

    // Retryable errors (network, rate limit, etc.)
    logger.warn("Retryable error - job will be retried", {
      copyTradeId,
      error: errorMessage,
    });

    // Throw to trigger retry
    throw error;
  }
}

// ============= Worker Lifecycle =============

/**
 * Start copy trade worker
 *
 * Creates and starts a BullMQ worker that processes copy trade jobs.
 * Worker will run continuously until stopped.
 *
 * @returns Worker instance
 *
 * @example
 * // In scripts/start-copy-trade-worker.ts
 * import { startCopyTradeWorker } from '@/lib/queue/copy-trade-worker';
 *
 * const worker = startCopyTradeWorker();
 *
 * process.on('SIGTERM', async () => {
 *   await stopCopyTradeWorker(worker);
 *   process.exit(0);
 * });
 */
export function startCopyTradeWorker(): Worker<CopyTradeJobData> {
  logger.info("Starting copy trade worker", {
    concurrency: WORKER_CONCURRENCY,
    timeout: JOB_TIMEOUT,
  });

  const worker = createWorker<CopyTradeJobData>(
    "copy-trades",
    async (job) => {
      // Add timeout wrapper
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Job timeout exceeded")),
          JOB_TIMEOUT,
        ),
      );

      // Process job with timeout (result is logged but not returned for type compatibility)
      await Promise.race([processCopyTradeJob(job), timeout]);
    },
    {
      concurrency: WORKER_CONCURRENCY,
    },
  );

  // Enhanced event logging
  worker.on("completed", (job) => {
    logger.info("Copy trade job completed", {
      jobId: job.id,
      duration: Date.now() - (job.processedOn ?? Date.now()),
    });
  });

  worker.on("failed", async (job, err) => {
    logger.error("Copy trade job failed permanently", {
      jobId: job?.id,
      error: err.message,
      attempts: job?.attemptsMade,
      maxAttempts: job?.opts.attempts,
    });

    // If job data contains copyTradeId, mark the CopyTrade as FAILED
    // This handles the case where all retries are exhausted
    if (job?.data.copyTradeId) {
      try {
        // Extract error code from message (format: "ERROR_CODE: description")
        const errorCodeMatch = err.message.match(/^([A-Z_]+):/);
        const errorCode = errorCodeMatch?.[1] ?? "JOB_EXHAUSTED";

        await failCopyTrade(
          job.data.copyTradeId,
          `Job failed after ${job.attemptsMade} attempts: ${err.message}`,
          errorCode,
          JSON.stringify(
            {
              message: err.message,
              stack: err.stack ?? "No stack trace",
              attempts: job.attemptsMade,
              maxAttempts: job.opts.attempts,
              jobId: job.id,
            },
            null,
            2,
          ),
        );

        logger.info("CopyTrade status synced to FAILED after job exhausted", {
          copyTradeId: job.data.copyTradeId,
          jobId: job.id,
          errorCode,
        });
      } catch (syncError) {
        logger.error("Failed to sync CopyTrade status to FAILED", {
          copyTradeId: job.data.copyTradeId,
          jobId: job.id,
          error:
            syncError instanceof Error ? syncError.message : String(syncError),
        });
      }
    }
  });

  worker.on("error", (err) => {
    logger.error("Worker error", {
      error: err.message,
    });
  });

  worker.on("stalled", (jobId) => {
    logger.warn("Job stalled (possible timeout)", {
      jobId,
    });
  });

  logger.info("Copy trade worker started successfully");

  return worker;
}

/**
 * Stop copy trade worker gracefully
 *
 * Waits for active jobs to complete before stopping.
 *
 * @param worker - Worker instance to stop
 */
export async function stopCopyTradeWorker(
  worker: Worker<CopyTradeJobData>,
): Promise<void> {
  logger.info("Stopping copy trade worker...");

  await worker.close();

  logger.info("Copy trade worker stopped successfully");
}

/**
 * Record loss after position is closed
 *
 * This function should be called when a copy trade position is closed with a loss.
 * It updates the circuit breaker counters and may trip the breaker if limits are exceeded.
 *
 * @param copyTradeId - ID of the closed copy trade
 */
export async function recordCopyTradeLoss(copyTradeId: string): Promise<void> {
  logger.info("Recording copy trade loss", { copyTradeId });

  // Get copy trade with PnL
  const copyTrade = await prisma.copyTrade.findUnique({
    where: { id: copyTradeId },
    select: {
      userId: true,
      manualPnl: true,
      status: true,
    },
  });

  if (!copyTrade) {
    logger.error("Copy trade not found", { copyTradeId });
    return;
  }

  if (copyTrade.status !== "EXECUTED") {
    logger.debug("Copy trade not executed yet, skipping loss recording", {
      copyTradeId,
      status: copyTrade.status,
    });
    return;
  }

  const pnl = copyTrade.manualPnl?.toNumber() ?? 0;

  // Only record losses (negative PnL)
  if (pnl < 0) {
    const lossUsd = Math.abs(pnl);
    await recordLoss(copyTrade.userId, lossUsd);

    logger.info("Copy trade loss recorded", {
      copyTradeId,
      userId: copyTrade.userId,
      lossUsd,
    });
  } else {
    logger.debug("Copy trade was profitable, no loss to record", {
      copyTradeId,
      pnl,
    });
  }
}
