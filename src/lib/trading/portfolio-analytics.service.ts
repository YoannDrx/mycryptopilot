/**
 * Portfolio Analytics Service
 *
 * Advanced portfolio analytics and performance metrics calculation.
 * Provides comprehensive insights into trading performance.
 *
 * Features:
 * - Performance metrics (Sharpe, Sortino, Calmar ratios)
 * - Risk analytics (VaR, max drawdown, volatility)
 * - Trade distribution analysis
 * - Time-based performance (daily, weekly, monthly returns)
 * - Symbol performance breakdown
 * - Win/loss streak analysis
 *
 * @example
 * const analytics = await calculatePortfolioAnalytics(traderProfileId);
 * console.log(`Sharpe Ratio: ${analytics.sharpeRatio}`);
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { TraderTrade } from "@/generated/prisma";

// ============= Types =============

export type PortfolioAnalytics = {
  // Basic Metrics
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  totalVolume: number;

  // Risk Metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  volatility: number;
  valueAtRisk95: number; // 95% VaR

  // Performance Ratios
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;

  // Trade Analysis
  avgWinAmount: number;
  avgLossAmount: number;
  avgTradeSize: number;
  avgHoldingPeriod: number; // in hours
  bestTrade: { symbol: string; pnl: number; returnPercent: number } | null;
  worstTrade: { symbol: string; pnl: number; returnPercent: number } | null;

  // Streaks
  currentStreak: { type: "win" | "loss"; count: number };
  longestWinStreak: number;
  longestLossStreak: number;

  // Time-based Returns
  dailyReturns: DailyReturn[];
  monthlyReturns: MonthlyReturn[];

  // Symbol Breakdown
  symbolPerformance: SymbolPerformance[];

  // Trading Frequency
  tradesPerDay: number;
  tradesPerWeek: number;
  mostActiveHour: number; // 0-23
  mostActiveDay: string; // Monday, Tuesday, etc.
};

export type DailyReturn = {
  date: Date;
  pnl: number;
  returnPercent: number;
  tradeCount: number;
};

export type MonthlyReturn = {
  year: number;
  month: number;
  pnl: number;
  returnPercent: number;
  tradeCount: number;
};

export type SymbolPerformance = {
  symbol: string;
  tradeCount: number;
  totalPnl: number;
  winRate: number;
  avgReturn: number;
  totalVolume: number;
};

export type DrawdownPeriod = {
  start: Date;
  end: Date | null;
  peak: number;
  trough: number;
  drawdown: number;
  drawdownPercent: number;
  duration: number; // in days
};

// ============= Calculation Functions =============

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(trades: TraderTrade[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
  drawdownPeriods: DrawdownPeriod[];
} {
  if (trades.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPercent: 0, drawdownPeriods: [] };
  }

  // Sort trades by close date
  const sortedTrades = [...trades]
    .filter((t) => t.closedAt && t.realizedPnl)
    .sort((a, b) => {
      // We filtered for closedAt above, so these are safe
      const aTime = a.closedAt?.getTime() ?? 0;
      const bTime = b.closedAt?.getTime() ?? 0;
      return aTime - bTime;
    });

  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let cumulative = 0;
  const drawdownPeriods: DrawdownPeriod[] = [];
  let currentDrawdown: DrawdownPeriod | null = null;

  for (const trade of sortedTrades) {
    cumulative += Number(trade.realizedPnl);

    if (cumulative > peak) {
      // New peak reached
      if (currentDrawdown) {
        currentDrawdown.end = trade.closedAt ?? new Date();
        drawdownPeriods.push(currentDrawdown);
        currentDrawdown = null;
      }
      peak = cumulative;
    } else {
      // In drawdown
      const drawdown = peak - cumulative;
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

      if (!currentDrawdown) {
        currentDrawdown = {
          start: trade.closedAt ?? new Date(),
          end: null,
          peak,
          trough: cumulative,
          drawdown,
          drawdownPercent,
          duration: 0,
        };
      } else {
        currentDrawdown.trough = Math.min(currentDrawdown.trough, cumulative);
        currentDrawdown.drawdown =
          currentDrawdown.peak - currentDrawdown.trough;
        currentDrawdown.drawdownPercent =
          currentDrawdown.peak > 0
            ? (currentDrawdown.drawdown / currentDrawdown.peak) * 100
            : 0;
      }

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }
  }

  // Close any open drawdown period
  if (currentDrawdown) {
    drawdownPeriods.push(currentDrawdown);
  }

  return { maxDrawdown, maxDrawdownPercent, drawdownPeriods };
}

/**
 * Calculate volatility (standard deviation of returns)
 */
function calculateVolatility(trades: TraderTrade[]): number {
  const returns = trades
    .filter((t) => t.realizedPnl !== null)
    .map((t) => {
      const invested = Number(t.totalQuantity) * Number(t.averageEntry);
      return invested > 0 ? Number(t.realizedPnl) / invested : 0;
    });

  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
}

/**
 * Calculate Value at Risk (95% confidence)
 */
function calculateVaR95(trades: TraderTrade[]): number {
  const returns = trades
    .filter((t) => t.realizedPnl)
    .map((t) => Number(t.realizedPnl))
    .sort((a, b) => a - b);

  if (returns.length === 0) return 0;

  // 95% VaR is the 5th percentile
  const index = Math.floor(returns.length * 0.05);
  return returns[index] ?? returns[0];
}

/**
 * Calculate Sharpe Ratio
 * (Return - Risk Free Rate) / Volatility
 * Assuming 0% risk-free rate for crypto
 */
function calculateSharpeRatio(
  avgReturn: number,
  volatility: number,
  riskFreeRate = 0,
): number {
  if (volatility === 0) return 0;
  return (avgReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Sortino Ratio
 * Similar to Sharpe but only considers downside volatility
 */
function calculateSortinoRatio(trades: TraderTrade[]): number {
  const returns = trades
    .filter((t) => t.realizedPnl !== null)
    .map((t) => {
      const invested = Number(t.totalQuantity) * Number(t.averageEntry);
      return invested > 0 ? Number(t.realizedPnl) / invested : 0;
    });

  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Only consider negative returns for downside deviation
  const negativeReturns = returns.filter((r) => r < 0);
  if (negativeReturns.length === 0) return mean > 0 ? Infinity : 0;

  const downsideVariance =
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    negativeReturns.length;

  const downsideDeviation = Math.sqrt(downsideVariance);

  return downsideDeviation > 0 ? mean / downsideDeviation : 0;
}

/**
 * Calculate Calmar Ratio
 * Annual Return / Max Drawdown
 */
function calculateCalmarRatio(
  totalReturn: number,
  maxDrawdown: number,
  periodDays: number,
): number {
  if (maxDrawdown === 0 || periodDays === 0) return 0;

  // Annualize the return
  const annualReturn = (totalReturn / periodDays) * 365;

  return annualReturn / Math.abs(maxDrawdown);
}

/**
 * Calculate win/loss streaks
 */
function calculateStreaks(trades: TraderTrade[]): {
  currentStreak: { type: "win" | "loss"; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
} {
  const sortedTrades = [...trades]
    .filter((t) => t.realizedPnl !== null)
    .sort(
      (a, b) => (a.closedAt?.getTime() ?? 0) - (b.closedAt?.getTime() ?? 0),
    );

  let currentStreak = { type: "win" as "win" | "loss", count: 0 };
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let winStreak = 0;
  let lossStreak = 0;

  for (const trade of sortedTrades) {
    const pnl = Number(trade.realizedPnl);

    if (pnl > 0) {
      winStreak++;
      lossStreak = 0;
      currentStreak = { type: "win", count: winStreak };
      longestWinStreak = Math.max(longestWinStreak, winStreak);
    } else if (pnl < 0) {
      lossStreak++;
      winStreak = 0;
      currentStreak = { type: "loss", count: lossStreak };
      longestLossStreak = Math.max(longestLossStreak, lossStreak);
    }
  }

  return { currentStreak, longestWinStreak, longestLossStreak };
}

/**
 * Calculate daily returns
 */
function calculateDailyReturns(trades: TraderTrade[]): DailyReturn[] {
  const dailyMap = new Map<string, DailyReturn>();

  for (const trade of trades) {
    if (!trade.closedAt || !trade.realizedPnl) continue;

    const dateKey = trade.closedAt.toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey);

    if (existing) {
      existing.pnl += Number(trade.realizedPnl);
      existing.tradeCount++;
    } else {
      dailyMap.set(dateKey, {
        date: new Date(dateKey),
        pnl: Number(trade.realizedPnl),
        returnPercent: 0, // Will calculate after
        tradeCount: 1,
      });
    }
  }

  const dailyReturns = Array.from(dailyMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Calculate return percentages
  let cumulative = 0;
  for (const day of dailyReturns) {
    const previousValue = cumulative;
    cumulative += day.pnl;
    day.returnPercent = previousValue > 0 ? (day.pnl / previousValue) * 100 : 0;
  }

  return dailyReturns;
}

/**
 * Calculate monthly returns
 */
function calculateMonthlyReturns(trades: TraderTrade[]): MonthlyReturn[] {
  const monthlyMap = new Map<string, MonthlyReturn>();

  for (const trade of trades) {
    if (!trade.closedAt || !trade.realizedPnl) continue;

    const year = trade.closedAt.getFullYear();
    const month = trade.closedAt.getMonth() + 1;
    const monthKey = `${year}-${month}`;

    const existing = monthlyMap.get(monthKey);

    if (existing) {
      existing.pnl += Number(trade.realizedPnl);
      existing.tradeCount++;
    } else {
      monthlyMap.set(monthKey, {
        year,
        month,
        pnl: Number(trade.realizedPnl),
        returnPercent: 0,
        tradeCount: 1,
      });
    }
  }

  const monthlyReturns = Array.from(monthlyMap.values()).sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month),
  );

  // Calculate return percentages
  let cumulative = 0;
  for (const month of monthlyReturns) {
    const previousValue = cumulative;
    cumulative += month.pnl;
    month.returnPercent =
      previousValue > 0 ? (month.pnl / previousValue) * 100 : 0;
  }

  return monthlyReturns;
}

/**
 * Calculate symbol performance breakdown
 */
function calculateSymbolPerformance(
  trades: TraderTrade[],
): SymbolPerformance[] {
  const symbolMap = new Map<string, SymbolPerformance>();

  for (const trade of trades) {
    const existing = symbolMap.get(trade.symbol);
    const pnl = Number(trade.realizedPnl ?? 0);
    const volume = Number(trade.totalQuantity) * Number(trade.averageEntry);

    if (existing) {
      existing.tradeCount++;
      existing.totalPnl += pnl;
      existing.totalVolume += volume;
      if (pnl > 0) {
        existing.winRate =
          (existing.winRate * (existing.tradeCount - 1) + 1) /
          existing.tradeCount;
      } else {
        existing.winRate =
          (existing.winRate * (existing.tradeCount - 1)) / existing.tradeCount;
      }
    } else {
      symbolMap.set(trade.symbol, {
        symbol: trade.symbol,
        tradeCount: 1,
        totalPnl: pnl,
        winRate: pnl > 0 ? 100 : 0,
        avgReturn: 0,
        totalVolume: volume,
      });
    }
  }

  // Calculate average returns
  for (const perf of symbolMap.values()) {
    perf.avgReturn =
      perf.totalVolume > 0 ? (perf.totalPnl / perf.totalVolume) * 100 : 0;
  }

  return Array.from(symbolMap.values()).sort((a, b) => b.totalPnl - a.totalPnl);
}

// ============= Main Analytics Function =============

/**
 * Calculate comprehensive portfolio analytics
 */
export async function calculatePortfolioAnalytics(
  traderProfileId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<PortfolioAnalytics> {
  logger.info("Calculating portfolio analytics", {
    traderProfileId,
    startDate,
    endDate,
  });

  // Fetch all trades
  const trades = await prisma.traderTrade.findMany({
    where: {
      traderProfileId,
      ...(startDate && { closedAt: { gte: startDate } }),
      ...(endDate && { closedAt: { lte: endDate } }),
    },
    orderBy: {
      closedAt: "asc",
    },
  });

  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  // Basic metrics
  const totalTrades = trades.length;
  const winningTrades = closedTrades.filter(
    (t) => Number(t.realizedPnl ?? 0) > 0,
  );
  const losingTrades = closedTrades.filter(
    (t) => Number(t.realizedPnl ?? 0) < 0,
  );
  const winRate =
    closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) * 100
      : 0;

  // Calculate PnL metrics
  const totalPnL = closedTrades.reduce(
    (sum, t) => sum + Number(t.realizedPnl ?? 0),
    0,
  );
  const totalWins = winningTrades.reduce(
    (sum, t) => sum + Number(t.realizedPnl ?? 0),
    0,
  );
  const totalLosses = Math.abs(
    losingTrades.reduce((sum, t) => sum + Number(t.realizedPnl ?? 0), 0),
  );
  const profitFactor =
    totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  // Average metrics
  const avgWinAmount =
    winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLossAmount =
    losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  // Volume metrics
  const totalVolume = trades.reduce(
    (sum, t) => sum + Number(t.totalQuantity) * Number(t.averageEntry),
    0,
  );
  const avgTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;

  // Holding period
  const holdingPeriods = closedTrades
    .filter((t) => t.closedAt !== null)
    .map((t) => {
      const closedTime = t.closedAt?.getTime() ?? 0;
      return (closedTime - t.openedAt.getTime()) / (1000 * 60 * 60);
    });
  const avgHoldingPeriod =
    holdingPeriods.length > 0
      ? holdingPeriods.reduce((sum, p) => sum + p, 0) / holdingPeriods.length
      : 0;

  // Best and worst trades
  let bestTrade: { symbol: string; pnl: number; returnPercent: number } | null =
    null;
  let worstTrade: {
    symbol: string;
    pnl: number;
    returnPercent: number;
  } | null = null;

  for (const trade of closedTrades) {
    if (!trade.realizedPnl) continue;
    const pnl = Number(trade.realizedPnl);
    const invested = Number(trade.totalQuantity) * Number(trade.averageEntry);
    const returnPercent = invested > 0 ? (pnl / invested) * 100 : 0;

    if (!bestTrade || pnl > bestTrade.pnl) {
      bestTrade = { symbol: trade.symbol, pnl, returnPercent };
    }
    if (!worstTrade || pnl < worstTrade.pnl) {
      worstTrade = { symbol: trade.symbol, pnl, returnPercent };
    }
  }

  // Risk metrics
  const { maxDrawdown, maxDrawdownPercent } =
    calculateMaxDrawdown(closedTrades);
  const volatility = calculateVolatility(closedTrades);
  const valueAtRisk95 = calculateVaR95(closedTrades);

  // Performance ratios
  const avgReturn =
    trades.length > 0 && totalVolume > 0 ? totalPnL / totalVolume : 0;
  const sharpeRatio = calculateSharpeRatio(avgReturn, volatility);
  const sortinoRatio = calculateSortinoRatio(closedTrades);

  // Calculate period in days for Calmar ratio
  const firstTrade = closedTrades[0];
  const lastTrade = closedTrades[closedTrades.length - 1];

  const periodDays =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    firstTrade && lastTrade
      ? ((lastTrade.closedAt?.getTime() ?? 0) -
          (firstTrade.closedAt?.getTime() ?? 0)) /
        (1000 * 60 * 60 * 24)
      : 0;
  const calmarRatio = calculateCalmarRatio(totalPnL, maxDrawdown, periodDays);

  // Streaks
  const { currentStreak, longestWinStreak, longestLossStreak } =
    calculateStreaks(closedTrades);

  // Time-based returns
  const dailyReturns = calculateDailyReturns(closedTrades);
  const monthlyReturns = calculateMonthlyReturns(closedTrades);

  // Symbol performance
  const symbolPerformance = calculateSymbolPerformance(trades);

  // Trading frequency
  const tradingDays = new Set(
    trades.map((t) => t.openedAt.toISOString().split("T")[0]),
  ).size;
  const tradesPerDay = tradingDays > 0 ? trades.length / tradingDays : 0;
  const tradesPerWeek = tradesPerDay * 7;

  // Most active hour and day
  const hourCounts = new Array(24).fill(0);
  const dayCounts: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };
  const dayNames = Object.keys(dayCounts);

  for (const trade of trades) {
    hourCounts[trade.openedAt.getHours()]++;
    dayCounts[dayNames[trade.openedAt.getDay()]]++;
  }

  const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
  const mostActiveDay = Object.entries(dayCounts).sort(
    (a, b) => b[1] - a[1],
  )[0][0];

  const analytics: PortfolioAnalytics = {
    // Basic Metrics
    totalTrades,
    winRate,
    profitFactor,
    totalPnL,
    totalVolume,

    // Risk Metrics
    maxDrawdown,
    maxDrawdownPercent,
    volatility,
    valueAtRisk95,

    // Performance Ratios
    sharpeRatio,
    sortinoRatio,
    calmarRatio,

    // Trade Analysis
    avgWinAmount,
    avgLossAmount,
    avgTradeSize,
    avgHoldingPeriod,
    bestTrade,
    worstTrade,

    // Streaks
    currentStreak,
    longestWinStreak,
    longestLossStreak,

    // Time-based Returns
    dailyReturns,
    monthlyReturns,

    // Symbol Breakdown
    symbolPerformance,

    // Trading Frequency
    tradesPerDay,
    tradesPerWeek,
    mostActiveHour,
    mostActiveDay,
  };

  logger.info("Portfolio analytics calculated", {
    traderProfileId,
    totalTrades,
    winRate,
    sharpeRatio,
  });

  return analytics;
}
