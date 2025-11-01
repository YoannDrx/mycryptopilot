/**
 * Performance Chart Component
 *
 * Displays portfolio performance over time using Recharts.
 */

"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type PerformanceData = {
  date: string;
  value: number;
  drawdown?: number;
  benchmark?: number;
};

type PerformanceChartProps = {
  data: PerformanceData[];
  title?: string;
  className?: string;
  showDrawdown?: boolean;
  showBenchmark?: boolean;
  period?: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
  onPeriodChange?: (period: string) => void;
};

export function PerformanceChart({
  data,
  title = "Performance",
  className,
  showDrawdown = false,
  showBenchmark = false,
  period = "1M",
  onPeriodChange,
}: PerformanceChartProps) {
  // Calculate performance metrics
  const metrics = useMemo(() => {
    if (data.length === 0) return null;

    const firstValue = data[0]?.value ?? 0;
    const lastValue = data[data.length - 1]?.value ?? 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));

    return {
      change,
      changePercent,
      maxValue,
      minValue,
    };
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: {
      color: string;
      name: string;
      value: number;
    }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background rounded-lg border p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="mt-1 flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground text-sm">{entry.name}:</span>
            <span className="text-sm font-medium">
              ${entry.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {onPeriodChange && (
          <Tabs value={period} onValueChange={onPeriodChange}>
            <TabsList className="grid w-[350px] grid-cols-7">
              <TabsTrigger value="1D">1D</TabsTrigger>
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="3M">3M</TabsTrigger>
              <TabsTrigger value="6M">6M</TabsTrigger>
              <TabsTrigger value="1Y">1Y</TabsTrigger>
              <TabsTrigger value="ALL">ALL</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent>
        {metrics && (
          <div className="mb-4 flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold">
                ${metrics.maxValue.toFixed(2)}
              </p>
              <p
                className={cn(
                  "text-sm font-medium",
                  metrics.changePercent >= 0
                    ? "text-green-500"
                    : "text-red-500",
                )}
              >
                {metrics.changePercent >= 0 ? "+" : ""}
                {metrics.changePercent.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={350}>
          {showDrawdown ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--muted))" />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorValue)"
                name="Portfolio Value"
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorDrawdown)"
                name="Drawdown"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Portfolio Value"
              />
              {showBenchmark && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Benchmark"
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Returns Distribution Chart
 *
 * Displays the distribution of returns as a histogram
 */
type ReturnsDistributionProps = {
  returns: number[];
  className?: string;
};

export function ReturnsDistribution({
  returns,
  className,
}: ReturnsDistributionProps) {
  // Create histogram buckets
  const buckets = useMemo(() => {
    if (returns.length === 0) return [];

    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const bucketSize = (max - min) / 20; // 20 buckets

    const histogram = new Array(20).fill(0);
    const labels: string[] = [];

    for (let i = 0; i < 20; i++) {
      const bucketMin = min + i * bucketSize;
      const bucketMax = bucketMin + bucketSize;
      labels.push(`${bucketMin.toFixed(1)}%`);

      returns.forEach((r) => {
        if (r >= bucketMin && r < bucketMax) {
          histogram[i]++;
        }
      });
    }

    return labels.map((label, i) => ({
      range: label,
      count: histogram[i],
    }));
  }, [returns]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Returns Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={buckets}>
            <defs>
              <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="range"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorDist)"
              name="Frequency"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
