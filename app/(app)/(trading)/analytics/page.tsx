import { getRequiredUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { LineChart, TrendingUp, Users, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TradersPerformanceChart } from "./_components/traders-performance-chart";
import { SignalsByAssetChart } from "./_components/signals-by-asset-chart";
import { TradersStatsCard } from "./_components/traders-stats-card";
import { DonutChart } from "./_components/donuts-chart";
import { UsersChart } from "./_components/users-chart";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Platform Analytics Page
 *
 * Big Bang (Issue #77 Phase 11) - Enriched with real charts
 * - Recovered 5 chart components from git history
 * - Real data queries for trader stats
 * - Mock data for other visualizations (demo purposes)
 */
export default async function AnalyticsPage() {
  await getRequiredUser();

  // Fetch real platform stats
  const [totalTraders, totalSignals, activeSignals] = await Promise.all([
    prisma.traderProfile.count({
      where: { verified: true },
    }),
    prisma.signal.count(),
    prisma.signal.count({
      where: {
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  // Calculate average win rate (simplified - would need proper aggregation)
  const traders = await prisma.traderProfile.findMany({
    select: { statsJson: true },
  });

  let avgWinRate = 0;
  if (traders.length > 0) {
    const winRates = traders
      .map((t) => {
        const stats = t.statsJson as { winrate?: number } | null;
        return stats?.winrate ?? 0;
      })
      .filter((w) => w > 0);

    avgWinRate =
      winRates.length > 0
        ? winRates.reduce((sum, w) => sum + w, 0) / winRates.length
        : 0;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LineChart className="size-8" />
        <div>
          <Typography variant="h1">Platform Analytics</Typography>
          <Typography variant="muted">
            Real-time statistics and performance metrics
          </Typography>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Traders
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTraders}</div>
            <Typography variant="muted" className="text-xs">
              Active verified traders
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSignals}</div>
            <Typography variant="muted" className="text-xs">
              {activeSignals} currently active
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Signals
            </CardTitle>
            <Activity className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSignals}</div>
            <Typography variant="muted" className="text-xs">
              Not yet expired
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
            <LineChart className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgWinRate > 0 ? `${avgWinRate.toFixed(1)}%` : "N/A"}
            </div>
            <Typography variant="muted" className="text-xs">
              Platform average
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traders Performance Chart */}
        <TradersPerformanceChart />

        {/* Top Verified Traders Card */}
        <Suspense
          fallback={
            <Card className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          }
        >
          <TradersStatsCard />
        </Suspense>
      </div>

      {/* Signals by Asset Chart */}
      <SignalsByAssetChart />

      {/* Additional Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users Chart (Desktop vs Mobile) */}
        <UsersChart />

        {/* Donut Chart (Browser Distribution) */}
        <DonutChart />
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle>📊 About These Analytics</CardTitle>
          <CardDescription>Data sources and information</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground ml-6 list-disc space-y-1 text-sm">
            <li>
              <strong>Top Stats Cards</strong>: Real-time data from the platform
              database
            </li>
            <li>
              <strong>Top Verified Traders</strong>: Live data showing the 3
              most recently verified traders
            </li>
            <li>
              <strong>Charts</strong>: Demo data for visualization purposes
              (will be connected to real analytics soon)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
