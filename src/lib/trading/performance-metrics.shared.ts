/**
 * Shared Performance Metrics Calculations
 *
 * Core financial metrics used across both exchange performance tracking
 * and manual trading analytics.
 *
 * These functions operate on generic data structures (arrays of returns,
 * trade objects) to avoid duplication between:
 * - performance-calculator.ts (ExchangeTrade-based, 35 tests)
 * - portfolio-analytics.service.ts (TraderTrade-based, advanced features)
 *
 * All metrics are tested via performance-calculator tests.
 */

/**
 * Calculate Sharpe Ratio
 *
 * Measures risk-adjusted return:
 * Sharpe = (Average Return - Risk-Free Rate) / Standard Deviation of Returns
 *
 * Industry standard:
 * - Sharpe > 1.0 = Good
 * - Sharpe > 2.0 = Very Good
 * - Sharpe > 3.0 = Excellent
 *
 * @param returns - Array of period returns (e.g., daily PnL as percentages)
 * @param riskFreeRate - Annual risk-free rate (default: 0.02 = 2%)
 * @returns Sharpe ratio or null if insufficient data
 *
 * @example
 * const dailyReturns = [0.5, -0.2, 0.8, 0.3, -0.1]; // %
 * const sharpe = calculateSharpeRatio(dailyReturns);
 * // sharpe ≈ 1.2 (good risk-adjusted performance)
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate = 0.02,
): number | null {
  if (returns.length < 2) return null;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calculate standard deviation
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;

  // Annualized Sharpe ratio (assuming daily returns)
  const excessReturn = avgReturn - riskFreeRate / 365;
  return (excessReturn / stdDev) * Math.sqrt(365);
}

/**
 * Calculate Sortino Ratio
 *
 * Similar to Sharpe but only penalizes downside volatility.
 * More realistic for traders who care about losses, not upside volatility.
 *
 * Sortino = (Average Return - Risk-Free Rate) / Downside Deviation
 *
 * Industry standard:
 * - Sortino > 1.5 = Good
 * - Sortino > 2.5 = Very Good
 * - Sortino > 3.5 = Excellent
 *
 * @param returns - Array of period returns
 * @param riskFreeRate - Annual risk-free rate (default: 0.02)
 * @returns Sortino ratio or null if insufficient data
 *
 * @example
 * const returns = [0.5, -0.2, 0.8, 0.3, -0.1];
 * const sortino = calculateSortinoRatio(returns);
 * // sortino > sharpe (because upside volatility not penalized)
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate = 0.02,
): number | null {
  if (returns.length < 2) return null;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Only consider negative returns for downside deviation
  const negativeReturns = returns.filter((r) => r < 0);

  if (negativeReturns.length === 0) {
    // No downside risk - infinite Sortino ratio (return null)
    return null;
  }

  const downsideVariance =
    negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) /
    negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);

  if (downsideDeviation === 0) return null;

  // Annualized Sortino ratio
  const excessReturn = avgReturn - riskFreeRate / 365;
  return (excessReturn / downsideDeviation) * Math.sqrt(365);
}

/**
 * Generic trade interface for max drawdown calculation
 *
 * Minimal requirements: timestamp and realized PnL
 */
export type TradeForDrawdown = {
  executedAt: Date;
  realizedPnl: number;
};

/**
 * Drawdown period information
 */
export type DrawdownPeriod = {
  start: Date;
  end: Date;
  peakValue: number;
  troughValue: number;
  drawdown: number;
  drawdownPercent: number;
  durationDays: number;
};

/**
 * Max drawdown calculation result
 */
export type MaxDrawdownResult = {
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;
  drawdownPeriods: DrawdownPeriod[];
};

/**
 * Calculate Maximum Drawdown
 *
 * Peak-to-trough decline in cumulative equity.
 * Critical risk metric - shows largest loss from peak.
 *
 * Formula:
 * MaxDD = (Trough Value - Peak Value) / Peak Value
 *
 * Industry standard:
 * - MaxDD < 10% = Excellent risk control
 * - MaxDD < 20% = Good
 * - MaxDD < 30% = Acceptable
 * - MaxDD > 50% = High risk
 *
 * @param trades - Array of trades with timestamp and PnL
 * @param initialBalance - Starting balance (default: 0 for cumulative PnL calculation)
 * @returns Drawdown metrics including all drawdown periods
 *
 * @example
 * const trades = [
 *   { executedAt: new Date('2024-01-01'), realizedPnl: 100 },
 *   { executedAt: new Date('2024-01-02'), realizedPnl: -200 },
 *   { executedAt: new Date('2024-01-03'), realizedPnl: 50 },
 * ];
 * const dd = calculateMaxDrawdown(trades);
 * // dd.maxDrawdownPercent based on cumulative PnL peaks
 */
export function calculateMaxDrawdown(
  trades: TradeForDrawdown[],
  initialBalance = 0,
): MaxDrawdownResult {
  if (trades.length === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      currentDrawdown: 0,
      currentDrawdownPercent: 0,
      drawdownPeriods: [],
    };
  }

  // Sort trades chronologically
  const sortedTrades = [...trades].sort(
    (a, b) => a.executedAt.getTime() - b.executedAt.getTime(),
  );

  let balance = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const drawdownPeriods: DrawdownPeriod[] = [];
  let currentDrawdownStart: Date | null = null;
  let currentDrawdownPeak = initialBalance;

  for (const trade of sortedTrades) {
    balance += trade.realizedPnl;

    if (balance > peak) {
      // New peak - end previous drawdown if any
      if (currentDrawdownStart) {
        const drawdown = currentDrawdownPeak - peak;
        const drawdownPercent =
          currentDrawdownPeak > 0 ? (drawdown / currentDrawdownPeak) * 100 : 0;

        const tradeIndex = sortedTrades.indexOf(trade);
        if (tradeIndex > 0) {
          const previousTrade = sortedTrades[tradeIndex - 1];
          const durationMs =
            previousTrade.executedAt.getTime() - currentDrawdownStart.getTime();
          const durationDays = durationMs / (1000 * 60 * 60 * 24);

          drawdownPeriods.push({
            start: currentDrawdownStart,
            end: previousTrade.executedAt,
            peakValue: currentDrawdownPeak,
            troughValue: peak,
            drawdown: Math.abs(drawdown),
            drawdownPercent: Math.abs(drawdownPercent),
            durationDays,
          });
        }

        currentDrawdownStart = null;
      }

      peak = balance;
      currentDrawdownPeak = balance;
    } else if (balance < peak) {
      // In drawdown
      if (!currentDrawdownStart) {
        currentDrawdownStart = trade.executedAt;
        currentDrawdownPeak = peak;
      }

      const drawdown = peak - balance;
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }
  }

  // Handle ongoing drawdown at end
  if (
    currentDrawdownStart &&
    balance < currentDrawdownPeak &&
    sortedTrades.length > 0
  ) {
    const lastTrade = sortedTrades[sortedTrades.length - 1];
    const drawdown = currentDrawdownPeak - balance;
    const drawdownPercent =
      currentDrawdownPeak > 0 ? (drawdown / currentDrawdownPeak) * 100 : 0;

    const durationMs =
      lastTrade.executedAt.getTime() - currentDrawdownStart.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    drawdownPeriods.push({
      start: currentDrawdownStart,
      end: lastTrade.executedAt,
      peakValue: currentDrawdownPeak,
      troughValue: balance,
      drawdown: Math.abs(drawdown),
      drawdownPercent: Math.abs(drawdownPercent),
      durationDays,
    });
  }

  const currentDrawdown = Math.max(0, peak - balance);
  const currentDrawdownPercent = peak > 0 ? (currentDrawdown / peak) * 100 : 0;

  return {
    maxDrawdown,
    maxDrawdownPercent,
    currentDrawdown,
    currentDrawdownPercent,
    drawdownPeriods,
  };
}

/**
 * Calculate weighted average
 *
 * Utility function for volume-weighted or time-weighted averages.
 *
 * @param values - Array of values
 * @param weights - Array of weights (must match values length)
 * @returns Weighted average or null if invalid
 *
 * @example
 * const prices = [100, 105, 110];
 * const volumes = [10, 20, 5];
 * const vwap = calculateWeightedAverage(prices, volumes);
 * // vwap = (100*10 + 105*20 + 110*5) / (10+20+5) ≈ 104.3
 */
export function calculateWeightedAverage(
  values: number[],
  weights: number[],
): number | null {
  if (values.length !== weights.length || values.length === 0) {
    return null;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) return null;

  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);

  return weightedSum / totalWeight;
}
