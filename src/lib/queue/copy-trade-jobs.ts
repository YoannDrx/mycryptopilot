/**
 * Copy Trade Job Types and Queue
 *
 * Defines job payloads and queue for automated copy-trading execution.
 * Jobs are processed by a worker that executes trades on user exchanges.
 *
 * Flow:
 * 1. Trader opens position -> Signal created
 * 2. For each follower with AUTO mode -> Job queued
 * 3. Worker processes job -> Circuit breaker check -> Exchange execution
 * 4. Result recorded in CopyTrade table
 */

import type { Queue } from "bullmq";
import { getQueue, QueueNames } from "./config";
import { logger } from "@/lib/logger";
import { rejectFinancialExecution } from "@/config/product-features";

// ============= Job Types =============

/**
 * Copy trade job payload
 *
 * Contains all information needed to execute a copy trade:
 * - User identification (circuit breaker check)
 * - Original trade reference (for parameters)
 * - Copy trade ID (for status updates)
 * - Execution parameters (quantity, limits)
 */
export type CopyTradeJobData = {
  // User identification
  userId: string;
  copyTradeId: string;

  // Original trade reference
  originalTradeId: string;
  traderProfileId: string;

  // Trade parameters
  symbol: string; // e.g., "BTCUSDT"
  side: "BUY" | "SELL"; // LONG or SHORT position
  orderType: "MARKET" | "LIMIT"; // Usually MARKET for copy trading
  quantity: number; // Calculated quantity for user
  instrumentType?: "SPOT" | "PERP"; // Instrument type (default: SPOT)

  // Optional parameters
  limitPrice?: number; // For LIMIT orders
  stopLoss?: number; // Optional SL override
  takeProfit?: number[]; // Optional TP overrides

  // Risk configuration
  copyRatio: number; // User's copy ratio (0.01 to 1.0)
  maxAmount?: number; // User's max amount limit

  // Execution preferences
  exchangeId: string; // UserExchangeConnection.id
  timeoutSeconds?: number; // Max execution time (default 30s)

  // Metadata
  createdAt: Date; // Job creation timestamp
  signalId?: string; // Optional signal reference
};

/**
 * Job result after successful execution
 */
export type CopyTradeJobResult = {
  copyTradeId: string;
  exchangeOrderId: string;
  executedPrice: number;
  executedQuantity: number;
  slippage: number;
  executedAt: Date;
};

/**
 * Job failure details
 */
export type CopyTradeJobError = {
  copyTradeId: string;
  reason: string;
  errorCode?:
    | "CIRCUIT_BREAKER_TRIPPED"
    | "EXCHANGE_ERROR"
    | "INSUFFICIENT_BALANCE"
    | "INVALID_SYMBOL"
    | "TIMEOUT"
    | "UNKNOWN";
  details?: unknown;
};

// ============= Queue Instance =============

/**
 * Global copy trade queue instance
 * Singleton pattern ensures single queue instance
 */
let copyTradeQueue: Queue<CopyTradeJobData> | null = null;

/**
 * Get copy trade queue instance
 * Creates queue on first call, returns cached instance on subsequent calls
 */
export function getCopyTradeQueue(): Queue<CopyTradeJobData> {
  rejectFinancialExecution("Copy-trade queue initialization");

  if (!copyTradeQueue) {
    copyTradeQueue = getQueue<CopyTradeJobData>(QueueNames.COPY_TRADES);
    logger.info("Copy trade queue initialized");
  }
  return copyTradeQueue;
}

// ============= Job Creation =============

/**
 * Queue a copy trade job for execution
 *
 * This is called when:
 * - A trader opens a new position (batch create for all followers)
 * - A user manually triggers a copy (single job)
 *
 * Job options:
 * - Priority: Higher priority for smaller amounts (execute faster)
 * - Delay: Optional delay for limit orders
 * - Timeout: 2 minutes max (circuit breaker might reject if too long)
 *
 * @returns Job ID for tracking
 */
export async function queueCopyTrade(
  data: CopyTradeJobData,
  options?: {
    priority?: number; // Higher = more important (default: 10)
    delay?: number; // Delay in milliseconds (default: 0)
  },
): Promise<string> {
  rejectFinancialExecution("Copy-trade queueing");

  const queue = getCopyTradeQueue();

  // Calculate priority based on amount (smaller trades = higher priority)
  const estimatedAmount = data.quantity * (data.limitPrice ?? 0);
  const priority = options?.priority ?? Math.max(1, 100 - estimatedAmount);

  const job = await queue.add(
    "execute-copy-trade",
    {
      ...data,
      createdAt: new Date(),
    },
    {
      priority,
      delay: options?.delay ?? 0,
      removeOnComplete: {
        age: 24 * 3600, // Keep 24h
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep 7 days
      },
    },
  );

  logger.info("Copy trade job queued", {
    jobId: job.id,
    copyTradeId: data.copyTradeId,
    userId: data.userId,
    symbol: data.symbol,
    quantity: data.quantity,
    priority,
  });

  return job.id ?? "";
}

/**
 * Batch queue copy trades for multiple users
 *
 * When a popular trader opens a position, this efficiently queues
 * copy trades for all followers at once.
 *
 * Features:
 * - Parallel job creation for performance
 * - Error handling per job (doesn't fail entire batch)
 * - Returns success/failure counts
 *
 * @returns {created, failed} counts
 */
export async function batchQueueCopyTrades(
  jobs: CopyTradeJobData[],
): Promise<{ created: number; failed: number }> {
  rejectFinancialExecution("Batch copy-trade queueing");

  logger.info("Batch queueing copy trades", {
    count: jobs.length,
  });

  const queue = getCopyTradeQueue();

  // Create all jobs in parallel
  const promises = jobs.map(async (jobData) => {
    const estimatedAmount = jobData.quantity * (jobData.limitPrice ?? 0);
    const priority = Math.max(1, 100 - estimatedAmount);

    return queue.add(
      "execute-copy-trade",
      {
        ...jobData,
        createdAt: new Date(),
      },
      {
        priority,
      },
    );
  });

  const results = await Promise.allSettled(promises);

  let created = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      created++;
    } else {
      failed++;
      logger.error("Failed to queue copy trade job", {
        error: result.reason,
      });
    }
  }

  logger.info("Batch queue completed", {
    created,
    failed,
    total: jobs.length,
  });

  return { created, failed };
}

/**
 * Cancel a pending copy trade job
 *
 * Removes job from queue if it hasn't been processed yet.
 * If job is already being processed, this will fail gracefully.
 *
 * @returns true if cancelled, false if job not found or already processing
 */
export async function cancelCopyTradeJob(
  jobId: string,
): Promise<{ success: boolean; reason?: string }> {
  const queue = getCopyTradeQueue();

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      logger.warn("Cannot cancel - job not found", { jobId });
      return { success: false, reason: "Job not found" };
    }

    const state = await job.getState();

    if (state === "completed" || state === "failed") {
      logger.warn("Cannot cancel - job already finished", { jobId, state });
      return { success: false, reason: `Job already ${state}` };
    }

    if (state === "active") {
      logger.warn("Cannot cancel - job is currently processing", { jobId });
      return { success: false, reason: "Job is being processed" };
    }

    await job.remove();

    logger.info("Copy trade job cancelled", { jobId });
    return { success: true };
  } catch (error) {
    logger.error("Error cancelling copy trade job", {
      jobId,
      error,
    });
    return { success: false, reason: "Error during cancellation" };
  }
}

/**
 * Get job status
 *
 * Useful for showing progress to users
 */
export async function getCopyTradeJobStatus(jobId: string): Promise<{
  state: string; // Job state from BullMQ
  progress?: number;
  result?: CopyTradeJobResult;
  error?: CopyTradeJobError;
  createdAt?: Date;
  processedAt?: Date;
}> {
  const queue = getCopyTradeQueue();

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      return { state: "unknown" };
    }

    const state = await job.getState();

    return {
      state,
      progress: job.progress as number | undefined,
      result: job.returnvalue as CopyTradeJobResult | undefined,
      error: job.failedReason
        ? ({ reason: job.failedReason } as CopyTradeJobError)
        : undefined,
      createdAt: job.timestamp ? new Date(job.timestamp) : undefined,
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
    };
  } catch (error) {
    logger.error("Error getting job status", {
      jobId,
      error,
    });
    return { state: "unknown" };
  }
}

/**
 * Get queue statistics
 *
 * Useful for monitoring and debugging
 */
export async function getCopyTradeQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}> {
  const queue = getCopyTradeQueue();

  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
  );

  logger.debug("Queue stats", counts);

  // Map BullMQ counts to our expected structure
  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    paused: counts.paused,
  };
}

/**
 * Clean up old completed/failed jobs
 *
 * Run this periodically (e.g., daily cron) to keep queue size manageable
 */
export async function cleanupOldJobs(options?: {
  completedAge?: number; // Default: 7 days
  failedAge?: number; // Default: 30 days
}): Promise<{ removedCompleted: number; removedFailed: number }> {
  const queue = getCopyTradeQueue();

  const completedAge = options?.completedAge ?? 7 * 24 * 3600 * 1000; // 7 days
  const failedAge = options?.failedAge ?? 30 * 24 * 3600 * 1000; // 30 days

  logger.info("Cleaning up old jobs", {
    completedAge,
    failedAge,
  });

  const removedCompleted = await queue.clean(completedAge, 1000, "completed");
  const removedFailed = await queue.clean(failedAge, 1000, "failed");

  logger.info("Cleanup completed", {
    removedCompleted: removedCompleted.length,
    removedFailed: removedFailed.length,
  });

  return {
    removedCompleted: removedCompleted.length,
    removedFailed: removedFailed.length,
  };
}
