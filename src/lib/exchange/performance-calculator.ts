/**
 * Performance Calculator
 *
 * Calculates trading performance metrics from exchange trades.
 *
 * Metrics calculated:
 * - Winrate: Percentage of profitable trades
 * - Profit Factor: Total profits / Total losses
 * - Sharpe Ratio: Risk-adjusted returns (optional)
 * - Sortino Ratio: Downside risk-adjusted returns (optional)
 * - Max Drawdown: Largest peak-to-trough decline (%)
 * - Average Win/Loss: Mean profit/loss per trade
 * - Largest Win/Loss: Best/worst single trade
 *
 * Supports 4 time periods:
 * - ALL_TIME: All historical trades
 * - 30D: Last 30 days
 * - 90D: Last 90 days
 * - 365D: Last 365 days
 *
 * @example
 * const metrics = calculatePerformanceMetrics(trades, 'ALL_TIME');
 * console.log(metrics.winrate); // 65.5 (%)
 */

import { logger } from "@/lib/logger";
import type { ExchangeTrade, PerformancePeriod } from "@/generated/prisma";
import type { Decimal } from "@prisma/client/runtime/library";

type PerformanceMetrics = {
  period: PerformancePeriod;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winrate: number; // Percentage (0-100)
  totalProfits: number;
  totalLosses: number;
  netPnl: number;
  profitFactor: number;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  maxDrawdown: number; // Percentage (0-100)
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
};

/**
 * Filter trades by time period
 *
 * @param trades - All trades
 * @param period - Time period to filter
 * @returns Filtered trades
 */
function filterTradesByPeriod(
  trades: ExchangeTrade[],
  period: PerformancePeriod,
): ExchangeTrade[] {
  if (period === "ALL_TIME") {
    return trades;
  }

  const now = Date.now();
  const daysMap: Record<Exclude<PerformancePeriod, "ALL_TIME">, number> = {
    LAST_30D: 30,
    LAST_90D: 90,
    LAST_365D: 365,
  };

  const days = daysMap[period];
  const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);

  return trades.filter((trade) => trade.executedAt >= cutoffDate);
}

/**
 * Convert Prisma Decimal to number
 */
function decimalToNumber(value: Decimal | null): number {
  return value ? Number(value.toString()) : 0;
}

/**
 * Calculate Sharpe Ratio
 *
 * Measures risk-adjusted returns.
 * Sharpe = (Mean Return - Risk-Free Rate) / Std Deviation of Returns
 *
 * We assume risk-free rate = 0 for simplicity.
 *
 * @param returns - Array of trade returns (PnL)
 * @returns Sharpe ratio or null if insufficient data
 */
function calculateSharpeRatio(returns: number[]): number | null {
  if (returns.length < 2) {
    return null; // Need at least 2 data points
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return null; // Avoid division by zero
  }

  return mean / stdDev;
}

/**
 * Calculate Sortino Ratio
 *
 * Similar to Sharpe but only considers downside volatility.
 * Sortino = (Mean Return - Risk-Free Rate) / Downside Deviation
 *
 * @param returns - Array of trade returns (PnL)
 * @returns Sortino ratio or null if insufficient data
 */
function calculateSortinoRatio(returns: number[]): number | null {
  if (returns.length < 2) {
    return null;
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Only consider negative returns for downside deviation
  const negativeReturns = returns.filter((r) => r < 0);

  if (negativeReturns.length === 0) {
    return null; // No losses = infinite Sortino (no downside risk)
  }

  const downsideVariance =
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    negativeReturns.length;
  const downsideDev = Math.sqrt(downsideVariance);

  if (downsideDev === 0) {
    return null;
  }

  return mean / downsideDev;
}

/**
 * Calculate Maximum Drawdown
 *
 * Max drawdown = largest peak-to-trough decline in cumulative PnL.
 * Expressed as a percentage.
 *
 * @param trades - Array of trades (sorted by executedAt)
 * @returns Max drawdown as percentage (0-100)
 */
function calculateMaxDrawdown(trades: ExchangeTrade[]): number {
  if (trades.length === 0) {
    return 0;
  }

  let cumulativePnl = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const trade of trades) {
    const pnl = decimalToNumber(trade.realizedPnl);
    cumulativePnl += pnl;

    // Update peak if we've reached a new high
    if (cumulativePnl > peak) {
      peak = cumulativePnl;
    }

    // Calculate drawdown from peak
    const drawdown = peak - cumulativePnl;

    // Update max drawdown
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Express as percentage of peak (avoid division by zero)
  if (peak === 0) {
    return 0;
  }

  return (maxDrawdown / Math.abs(peak)) * 100;
}

/**
 * Calculate performance metrics for a set of trades
 *
 * @param trades - Array of trades
 * @param period - Time period identifier
 * @returns Performance metrics
 */
export function calculatePerformanceMetrics(
  trades: ExchangeTrade[],
  period: PerformancePeriod,
): PerformanceMetrics {
  const startTime = Date.now();

  logger.info("Calculating performance metrics", {
    period,
    totalTrades: trades.length,
  });

  // Filter trades by period
  const filteredTrades = filterTradesByPeriod(trades, period);

  // Sort by execution date for drawdown calculation
  const sortedTrades = [...filteredTrades].sort(
    (a, b) => a.executedAt.getTime() - b.executedAt.getTime(),
  );

  // Extract PnL values
  const pnlValues = sortedTrades.map((t) => decimalToNumber(t.realizedPnl));

  // Separate winning and losing trades
  const winningTrades = pnlValues.filter((pnl) => pnl > 0);
  const losingTrades = pnlValues.filter((pnl) => pnl < 0);

  // Calculate basic metrics
  const totalTrades = pnlValues.length;
  const winningCount = winningTrades.length;
  const losingCount = losingTrades.length;

  const totalProfits = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0));
  const netPnl = totalProfits - totalLosses;

  const winrate = totalTrades > 0 ? (winningCount / totalTrades) * 100 : 0;

  const profitFactor = totalLosses > 0 ? totalProfits / totalLosses : 0;

  const averageWin = winningCount > 0 ? totalProfits / winningCount : 0;
  const averageLoss = losingCount > 0 ? totalLosses / losingCount : 0;

  const largestWin = winningCount > 0 ? Math.max(...winningTrades) : 0;
  const largestLoss = losingCount > 0 ? Math.abs(Math.min(...losingTrades)) : 0;

  // Calculate advanced metrics (optional)
  const sharpeRatio = calculateSharpeRatio(pnlValues);
  const sortinoRatio = calculateSortinoRatio(pnlValues);
  const maxDrawdown = calculateMaxDrawdown(sortedTrades);

  const duration = Date.now() - startTime;

  logger.info("Performance metrics calculated", {
    period,
    totalTrades,
    winrate: winrate.toFixed(2),
    netPnl: netPnl.toFixed(2),
    durationMs: duration,
  });

  return {
    period,
    totalTrades,
    winningTrades: winningCount,
    losingTrades: losingCount,
    winrate,
    totalProfits,
    totalLosses,
    netPnl,
    profitFactor,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
  };
}

/**
 * Calculate and upsert performance snapshots for all periods
 *
 * @param traderProfileId - Trader profile ID
 * @param trades - All trades for the trader
 */
export async function updatePerformanceSnapshots(
  traderProfileId: string,
  trades: ExchangeTrade[],
): Promise<void> {
  const { prisma } = await import("@/lib/prisma");

  logger.info("Updating performance snapshots", {
    traderProfileId,
    totalTrades: trades.length,
  });

  const periods: PerformancePeriod[] = [
    "ALL_TIME",
    "LAST_30D",
    "LAST_90D",
    "LAST_365D",
  ];

  // Calculate metrics for all periods
  const metricsPromises = periods.map(async (period) => {
    const metrics = calculatePerformanceMetrics(trades, period);

    // Upsert snapshot to DB
    await prisma.traderPerformanceSnapshot.upsert({
      where: {
        traderProfileId_period: {
          traderProfileId,
          period,
        },
      },
      update: {
        totalTrades: metrics.totalTrades,
        winningTrades: metrics.winningTrades,
        losingTrades: metrics.losingTrades,
        winrate: metrics.winrate,
        totalProfits: metrics.totalProfits,
        totalLosses: metrics.totalLosses,
        netPnl: metrics.netPnl,
        profitFactor: metrics.profitFactor,
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio: metrics.sortinoRatio,
        maxDrawdown: metrics.maxDrawdown,
        averageWin: metrics.averageWin,
        averageLoss: metrics.averageLoss,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
        calculatedAt: new Date(),
      },
      create: {
        traderProfileId,
        period,
        totalTrades: metrics.totalTrades,
        winningTrades: metrics.winningTrades,
        losingTrades: metrics.losingTrades,
        winrate: metrics.winrate,
        totalProfits: metrics.totalProfits,
        totalLosses: metrics.totalLosses,
        netPnl: metrics.netPnl,
        profitFactor: metrics.profitFactor,
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio: metrics.sortinoRatio,
        maxDrawdown: metrics.maxDrawdown,
        averageWin: metrics.averageWin,
        averageLoss: metrics.averageLoss,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
        calculatedAt: new Date(),
      },
    });

    logger.info("Performance snapshot updated", {
      traderProfileId,
      period,
      totalTrades: metrics.totalTrades,
      winrate: metrics.winrate.toFixed(2),
    });
  });

  await Promise.all(metricsPromises);

  logger.info("All performance snapshots updated", {
    traderProfileId,
    periodsUpdated: periods.length,
  });
}
