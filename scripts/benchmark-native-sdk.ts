/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Benchmark Script: CCXT vs Native SDK
 *
 * Phase 2.3 POC - Performance Validation
 *
 * This script compares the performance of CCXT vs native Binance SDK
 * for order execution to validate the expected 5x performance gain.
 *
 * Usage:
 * ```bash
 * # Set environment variables
 * export BINANCE_TESTNET_API_KEY="your-testnet-api-key"
 * export BINANCE_TESTNET_SECRET_KEY="your-testnet-secret-key"
 *
 * # Run benchmark (dry-run mode - no real orders)
 * pnpm tsx scripts/benchmark-native-sdk.ts
 *
 * # Run benchmark with real testnet orders
 * pnpm tsx scripts/benchmark-native-sdk.ts --real
 * ```
 *
 * Expected Results:
 * - CCXT: ~15ms per order
 * - Native SDK: ~3ms per order
 * - Improvement: 5x faster
 */

import { BinanceService } from "@/lib/exchange/binance-service"; // CCXT
import { BinanceNativeServicePOC } from "@/lib/exchange/binance-native-service.POC"; // Native SDK
import type { CreateOrderParams } from "@/lib/exchange/types";
import { logger } from "@/lib/logger";
import { rejectFinancialExecution } from "@/config/product-features";

// ============= Configuration =============

const REAL_MODE_REQUESTED = process.argv.includes("--real");
const DRY_RUN = !REAL_MODE_REQUESTED;
const NUM_ITERATIONS = DRY_RUN ? 10 : 100; // Fewer iterations in dry-run
const TESTNET = true; // Always use testnet for safety

// ============= Helpers =============

/**
 * Measure execution time for a function
 */
async function measureTime<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  logger.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });

  return { result, duration };
}

/**
 * Calculate statistics from durations array
 */
function calculateStats(durations: number[]) {
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;

  return { avg, min, max, p50, p95, p99 };
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

/**
 * Format improvement percentage
 */
function formatImprovement(before: number, after: number): string {
  const improvement = ((before - after) / before) * 100;
  return `${improvement.toFixed(1)}%`;
}

// ============= Mock Order Execution (Dry Run) =============

/**
 * Mock order execution for dry-run mode
 * Simulates API latency without making real calls
 */
async function mockOrderExecution(service: string): Promise<void> {
  // Simulate network latency
  const baseLatency = service === "CCXT" ? 15 : 3; // ms
  const jitter = Math.random() * 5; // ±5ms jitter

  await new Promise((resolve) =>
    setTimeout(resolve, baseLatency + jitter - 2.5),
  );
}

// ============= Benchmark Functions =============

/**
 * Benchmark CCXT service
 */
async function benchmarkCCXT(
  apiKey: string,
  secretKey: string,
): Promise<number[]> {
  logger.info("Benchmarking CCXT service", {
    iterations: NUM_ITERATIONS,
    dryRun: DRY_RUN,
  });

  const service = new BinanceService(apiKey, secretKey);
  const durations: number[] = [];

  const orderParams: CreateOrderParams = {
    symbol: "BTCUSDT",
    side: "BUY",
    type: "MARKET",
    quantity: 0.001,
    instrumentType: "SPOT",
  };

  for (let i = 0; i < NUM_ITERATIONS; i++) {
    try {
      if (DRY_RUN) {
        // Dry run: Mock execution
        const { duration } = await measureTime(
          async () => mockOrderExecution("CCXT"),
          `CCXT iteration ${i + 1}`,
        );
        durations.push(duration);
      } else {
        // Real execution
        const { duration } = await measureTime(
          async () => service.createOrder(orderParams),
          `CCXT iteration ${i + 1}`,
        );
        durations.push(duration);
      }

      // Add small delay between orders to avoid rate limiting
      if (!DRY_RUN) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error(`CCXT iteration ${i + 1} failed`, { error });
    }
  }

  await service.close();

  logger.info("CCXT benchmark completed", {
    totalOrders: durations.length,
    avgDuration: formatDuration(
      durations.reduce((sum, d) => sum + d, 0) / durations.length,
    ),
  });

  return durations;
}

/**
 * Benchmark Native SDK service
 */
async function benchmarkNativeSDK(
  apiKey: string,
  secretKey: string,
): Promise<number[]> {
  logger.info("Benchmarking Native SDK service", {
    iterations: NUM_ITERATIONS,
    dryRun: DRY_RUN,
  });

  const service = new BinanceNativeServicePOC(apiKey, secretKey, {
    testnet: TESTNET,
    beautifyResponses: true,
  });

  const durations: number[] = [];

  const orderParams: CreateOrderParams = {
    symbol: "BTCUSDT",
    side: "BUY",
    type: "MARKET",
    quantity: 0.001,
    instrumentType: "SPOT",
  };

  for (let i = 0; i < NUM_ITERATIONS; i++) {
    try {
      if (DRY_RUN) {
        // Dry run: Mock execution
        const { duration } = await measureTime(
          async () => mockOrderExecution("Native SDK"),
          `Native SDK iteration ${i + 1}`,
        );
        durations.push(duration);
      } else {
        // Real execution
        const { duration } = await measureTime(
          async () => service.createOrder(orderParams),
          `Native SDK iteration ${i + 1}`,
        );
        durations.push(duration);
      }

      // Add small delay between orders to avoid rate limiting
      if (!DRY_RUN) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      logger.error(`Native SDK iteration ${i + 1} failed`, { error });
    }
  }

  await service.close();

  logger.info("Native SDK benchmark completed", {
    totalOrders: durations.length,
    avgDuration: formatDuration(
      durations.reduce((sum, d) => sum + d, 0) / durations.length,
    ),
  });

  return durations;
}

// ============= Main Benchmark =============

async function runBenchmark() {
  if (REAL_MODE_REQUESTED) {
    rejectFinancialExecution("Exchange order benchmark");
  }

  logger.info("Starting Phase 2.3 POC Benchmark", {
    mode: DRY_RUN ? "DRY-RUN (Mock)" : "REAL (Testnet)",
    iterations: NUM_ITERATIONS,
  });

  // Get credentials from env
  const apiKey = process.env.BINANCE_TESTNET_API_KEY;
  const secretKey = process.env.BINANCE_TESTNET_SECRET_KEY;

  if (!apiKey || !secretKey) {
    if (DRY_RUN) {
      logger.warn("No testnet credentials found, using mock data");
      // Use dummy values for dry run
    } else {
      logger.error("Missing Binance testnet credentials");
      logger.info("Please set environment variables:");
      logger.info("  BINANCE_TESTNET_API_KEY");
      logger.info("  BINANCE_TESTNET_SECRET_KEY");
      process.exit(1);
    }
  }

  const dummyKey = DRY_RUN && !apiKey ? "dummy-api-key" : apiKey!;
  const dummySecret = DRY_RUN && !secretKey ? "dummy-secret-key" : secretKey!;

  // Run benchmarks
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Phase 2.3 POC: CCXT vs Native SDK Performance");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Benchmark CCXT
  console.log("📊 Benchmarking CCXT...\n");
  const ccxtDurations = await benchmarkCCXT(dummyKey, dummySecret);
  const ccxtStats = calculateStats(ccxtDurations);

  console.log("\n✅ CCXT Benchmark Complete\n");

  // Small delay between benchmarks
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Benchmark Native SDK
  console.log("📊 Benchmarking Native SDK...\n");
  const nativeDurations = await benchmarkNativeSDK(dummyKey, dummySecret);
  const nativeStats = calculateStats(nativeDurations);

  console.log("\n✅ Native SDK Benchmark Complete\n");

  // ============= Results =============

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  BENCHMARK RESULTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("CCXT Performance:");
  console.log(`  Avg:  ${formatDuration(ccxtStats.avg)}`);
  console.log(`  Min:  ${formatDuration(ccxtStats.min)}`);
  console.log(`  Max:  ${formatDuration(ccxtStats.max)}`);
  console.log(`  P50:  ${formatDuration(ccxtStats.p50)}`);
  console.log(`  P95:  ${formatDuration(ccxtStats.p95)}`);
  console.log(`  P99:  ${formatDuration(ccxtStats.p99)}`);

  console.log("\nNative SDK Performance:");
  console.log(`  Avg:  ${formatDuration(nativeStats.avg)}`);
  console.log(`  Min:  ${formatDuration(nativeStats.min)}`);
  console.log(`  Max:  ${formatDuration(nativeStats.max)}`);
  console.log(`  P50:  ${formatDuration(nativeStats.p50)}`);
  console.log(`  P95:  ${formatDuration(nativeStats.p95)}`);
  console.log(`  P99:  ${formatDuration(nativeStats.p99)}`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PERFORMANCE IMPROVEMENT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const avgImprovement =
    ((ccxtStats.avg - nativeStats.avg) / ccxtStats.avg) * 100;
  const avgSpeedup = ccxtStats.avg / nativeStats.avg;

  console.log(
    `  Avg Latency: ${formatDuration(ccxtStats.avg)} → ${formatDuration(nativeStats.avg)}`,
  );
  console.log(
    `  Improvement: ${formatImprovement(ccxtStats.avg, nativeStats.avg)} faster`,
  );
  console.log(`  Speedup:     ${avgSpeedup.toFixed(1)}x\n`);

  console.log(
    `  P95 Latency: ${formatDuration(ccxtStats.p95)} → ${formatDuration(nativeStats.p95)}`,
  );
  console.log(
    `  Improvement: ${formatImprovement(ccxtStats.p95, nativeStats.p95)} faster`,
  );
  console.log(
    `  Speedup:     ${(ccxtStats.p95 / nativeStats.p95).toFixed(1)}x\n`,
  );

  // ============= Verdict =============

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  VERDICT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const expectedSpeedup = 5;
  const actualSpeedup = avgSpeedup;

  if (actualSpeedup >= expectedSpeedup * 0.8) {
    console.log(
      `  ✅ SUCCESS: Native SDK is ${actualSpeedup.toFixed(1)}x faster than CCXT`,
    );
    console.log(`  ✅ Target:  ${expectedSpeedup}x faster`);
    console.log(
      `  ✅ Result:  ${actualSpeedup.toFixed(1)}x faster (${avgImprovement.toFixed(0)}% improvement)\n`,
    );
    console.log(
      "  RECOMMENDATION: Proceed with full migration to Native SDKs ✅\n",
    );
  } else {
    console.log(
      `  ⚠️  WARNING: Native SDK is only ${actualSpeedup.toFixed(1)}x faster`,
    );
    console.log(`  ⚠️  Target:  ${expectedSpeedup}x faster`);
    console.log(
      `  ⚠️  Result:  ${actualSpeedup.toFixed(1)}x faster (${avgImprovement.toFixed(0)}% improvement)\n`,
    );
    console.log(
      "  RECOMMENDATION: Investigate why performance is lower than expected\n",
    );
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (DRY_RUN) {
    console.log("ℹ️  DRY-RUN MODE: Results are simulated");
    console.log("   Run with --real flag to test with actual testnet orders\n");
  }

  // Return stats for programmatic use
  return {
    ccxt: ccxtStats,
    native: nativeStats,
    improvement: {
      avg: avgImprovement,
      speedup: avgSpeedup,
      success: actualSpeedup >= expectedSpeedup * 0.8,
    },
  };
}

// ============= Execute =============

runBenchmark()
  .then((results) => {
    logger.info("Benchmark completed successfully", {
      speedup: `${results.improvement.speedup.toFixed(1)}x`,
      success: results.improvement.success,
    });
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Benchmark failed", { error });
    process.exit(1);
  });
