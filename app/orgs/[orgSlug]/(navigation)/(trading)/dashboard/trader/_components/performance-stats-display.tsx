"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TraderPerformanceSnapshot } from "@/generated/prisma";
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

type PerformanceStatsDisplayProps = {
  snapshot: TraderPerformanceSnapshot | null;
  loading?: boolean;
};

export const PerformanceStatsDisplay = ({
  snapshot,
  loading = false,
}: PerformanceStatsDisplayProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="bg-muted h-4 w-24 rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 w-32 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Performance Data</CardTitle>
          <CardDescription>
            Connect your exchange to start tracking verified performance stats
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="mb-4 size-12 opacity-20" />
          <p className="mb-2 font-medium">No trades synced yet</p>
          <p className="text-sm">
            Connect your exchange and wait for the first sync to complete
          </p>
        </CardContent>
      </Card>
    );
  }

  const winrate = Number(snapshot.winrate);
  const profitFactor = Number(snapshot.profitFactor);
  const netPnl = Number(snapshot.netPnl);
  const maxDrawdown = Number(snapshot.maxDrawdown);
  const sharpeRatio = snapshot.sharpeRatio
    ? Number(snapshot.sharpeRatio)
    : null;
  const sortinoRatio = snapshot.sortinoRatio
    ? Number(snapshot.sortinoRatio)
    : null;

  // Calculate badge variant based on performance
  const getWinrateBadge = () => {
    if (winrate >= 60)
      return { variant: "default" as const, label: "Excellent" };
    if (winrate >= 50) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Needs Improvement" };
  };

  const winrateBadge = getWinrateBadge();

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Winrate */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winrate.toFixed(1)}%</div>
            <Badge variant={winrateBadge.variant} className="mt-2">
              {winrateBadge.label}
            </Badge>
            <p className="text-muted-foreground mt-1 text-xs">
              {snapshot.winningTrades} wins / {snapshot.losingTrades} losses
            </p>
          </CardContent>
        </Card>

        {/* Net PnL */}
        <Card
          className={
            netPnl >= 0
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
              : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net PnL</CardTitle>
            {netPnl >= 0 ? (
              <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {netPnl >= 0 ? "+" : ""}
              {netPnl.toFixed(2)} USDT
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {snapshot.totalTrades} total trades
            </p>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitFactor.toFixed(2)}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {profitFactor >= 2
                ? "Excellent"
                : profitFactor >= 1.5
                  ? "Good"
                  : profitFactor >= 1
                    ? "Profitable"
                    : "Unprofitable"}
            </p>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              -{maxDrawdown.toFixed(2)}%
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Largest peak-to-trough decline
            </p>
          </CardContent>
        </Card>

        {/* Average Win */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Win</CardTitle>
            <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{Number(snapshot.averageWin).toFixed(2)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Per winning trade
            </p>
          </CardContent>
        </Card>

        {/* Average Loss */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
            <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{Number(snapshot.averageLoss).toFixed(2)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Per losing trade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics (if available) */}
      {(sharpeRatio !== null || sortinoRatio !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Risk-Adjusted Returns</CardTitle>
            <CardDescription>
              Advanced metrics for professional traders
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {sharpeRatio !== null && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Sharpe Ratio</p>
                <p className="text-2xl font-bold">{sharpeRatio.toFixed(2)}</p>
                <p className="text-muted-foreground text-xs">
                  {sharpeRatio >= 2
                    ? "Excellent"
                    : sharpeRatio >= 1
                      ? "Good"
                      : "Needs improvement"}
                </p>
              </div>
            )}
            {sortinoRatio !== null && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Sortino Ratio</p>
                <p className="text-2xl font-bold">{sortinoRatio.toFixed(2)}</p>
                <p className="text-muted-foreground text-xs">
                  Downside risk-adjusted
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Largest Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Largest Trades</CardTitle>
          <CardDescription>Best and worst single trades</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Largest Win
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{Number(snapshot.largestWin).toFixed(2)} USDT
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Largest Loss
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{Number(snapshot.largestLoss).toFixed(2)} USDT
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
