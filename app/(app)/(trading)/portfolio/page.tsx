/**
 * Portfolio Analytics Dashboard
 *
 * Big Bang (Issue #77 Phase 11) - Adapted for user-centric architecture
 * - Removed getRequiredCurrentOrg()
 * - Direct URLs (no /orgs/${slug} prefix)
 *
 * Main dashboard page for portfolio analytics and performance metrics.
 */

import { Suspense } from "react";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getPortfolioAnalyticsAction,
  getTradeHistoryAction,
  getPerformanceSnapshotAction,
} from "@/features/portfolio/portfolio.action";
import { MetricCard, MetricCardGrid } from "@/components/portfolio/metric-card";
import {
  PerformanceChart,
  ReturnsDistribution,
} from "@/components/portfolio/performance-chart";
import { TradeHistoryTable } from "@/components/portfolio/trade-history-table";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Award,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Loading components
function MetricCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6">
      <Skeleton className="mb-4 h-6 w-32" />
      <Skeleton className="h-[350px] w-full" />
    </div>
  );
}

// Async components
async function PortfolioMetrics() {
  const analyticsResult = await getPortfolioAnalyticsAction({});
  const snapshotResult = await getPerformanceSnapshotAction({
    period: "month",
  });

  if (!analyticsResult.data || !snapshotResult.data) {
    return (
      <MetricCardGrid columns={4}>
        <MetricCard label="Total Value" value="--" icon={<DollarSign />} />
        <MetricCard label="Total PnL" value="--" icon={<TrendingUp />} />
        <MetricCard label="Win Rate" value="--" icon={<Award />} />
        <MetricCard label="Sharpe Ratio" value="--" icon={<Activity />} />
      </MetricCardGrid>
    );
  }

  const analytics = analyticsResult.data;
  const snapshot = snapshotResult.data;

  return (
    <MetricCardGrid columns={4}>
      <MetricCard
        label="Total Value"
        value={analytics.totalVolume}
        format="currency"
        icon={<DollarSign />}
        change={snapshot.pnlChange}
        changeLabel="vs last period"
        trend={
          snapshot.pnlChange > 0
            ? "positive"
            : snapshot.pnlChange < 0
              ? "negative"
              : "neutral"
        }
      />
      <MetricCard
        label="Total PnL"
        value={snapshot.totalPnL}
        format="currency"
        icon={<TrendingUp />}
        change={snapshot.pnlChange}
        changeLabel="return"
        trend={
          snapshot.totalPnL > 0
            ? "positive"
            : snapshot.totalPnL < 0
              ? "negative"
              : "neutral"
        }
      />
      <MetricCard
        label="Win Rate"
        value={analytics.winRate}
        format="percentage"
        icon={<Award />}
      />
      <MetricCard
        label="Sharpe Ratio"
        value={analytics.sharpeRatio.toFixed(2)}
        icon={<Activity />}
        trend={
          analytics.sharpeRatio > 1
            ? "positive"
            : analytics.sharpeRatio < 0
              ? "negative"
              : "neutral"
        }
      />
    </MetricCardGrid>
  );
}

async function RiskMetrics() {
  const analyticsResult = await getPortfolioAnalyticsAction({});

  if (!analyticsResult.data) {
    return (
      <MetricCardGrid columns={3}>
        <MetricCard label="Max Drawdown" value="--" icon={<AlertTriangle />} />
        <MetricCard
          label="Value at Risk (95%)"
          value="--"
          icon={<BarChart3 />}
        />
        <MetricCard label="Sortino Ratio" value="--" icon={<Activity />} />
      </MetricCardGrid>
    );
  }

  const analytics = analyticsResult.data;

  return (
    <MetricCardGrid columns={3}>
      <MetricCard
        label="Max Drawdown"
        value={analytics.maxDrawdown}
        format="percentage"
        icon={<AlertTriangle />}
        trend="negative"
      />
      <MetricCard
        label="Value at Risk (95%)"
        value={analytics.valueAtRisk95}
        format="currency"
        icon={<BarChart3 />}
      />
      <MetricCard
        label="Sortino Ratio"
        value={analytics.sortinoRatio.toFixed(2)}
        icon={<Activity />}
        trend={
          analytics.sortinoRatio > 1.5
            ? "positive"
            : analytics.sortinoRatio < 0
              ? "negative"
              : "neutral"
        }
      />
    </MetricCardGrid>
  );
}

async function PerformanceChartSection() {
  const analyticsResult = await getPortfolioAnalyticsAction({});

  if (!analyticsResult.data) {
    return (
      <>
        <ChartSkeleton />
        <ChartSkeleton />
      </>
    );
  }

  const analytics = analyticsResult.data;

  // Transform daily returns to chart data
  const chartData = analytics.dailyReturns.map((dailyReturn, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (analytics.dailyReturns.length - index - 1));
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: dailyReturn.pnl,
      drawdown: 0, // Drawdown series not available yet
    };
  });

  // Extract return values for distribution chart
  const returnValues = analytics.dailyReturns.map((dr) => dr.returnPercent);

  return (
    <>
      <PerformanceChart
        data={chartData}
        title="Portfolio Performance"
        showDrawdown={false}
        className="col-span-2"
      />
      <ReturnsDistribution returns={returnValues} className="col-span-1" />
    </>
  );
}

async function TradeHistorySection() {
  const tradesResult = await getTradeHistoryAction({ limit: 100 });

  if (!tradesResult.data) {
    return <TradeHistoryTable trades={[]} />;
  }

  return <TradeHistoryTable trades={tradesResult.data} />;
}

export default async function PortfolioPage() {
  const user = await getRequiredUser();

  // Check if user has a trader profile
  const traderProfile = await prisma.traderProfile.findUnique({
    where: { userId: user.id },
  });

  if (!traderProfile) {
    redirect("/account/become-trader");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Portfolio Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your trading performance and risk metrics
        </p>
      </div>

      {/* Key Metrics */}
      <Suspense
        fallback={
          <MetricCardGrid columns={4}>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </MetricCardGrid>
        }
      >
        <PortfolioMetrics />
      </Suspense>

      {/* Tabs for different views */}
      <Tabs defaultValue="performance" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            <Suspense
              fallback={
                <>
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                </>
              }
            >
              <PerformanceChartSection />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <Suspense
            fallback={
              <MetricCardGrid columns={3}>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </MetricCardGrid>
            }
          >
            <RiskMetrics />
          </Suspense>
        </TabsContent>

        <TabsContent value="trades" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <TradeHistorySection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
