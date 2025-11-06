"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", longSignals: 128, shortSignals: 58 },
  { month: "February", longSignals: 187, shortSignals: 118 },
  { month: "March", longSignals: 149, shortSignals: 88 },
  { month: "April", longSignals: 165, shortSignals: 108 },
  { month: "May", longSignals: 198, shortSignals: 111 },
  { month: "June", longSignals: 221, shortSignals: 121 },
];

const chartConfig = {
  longSignals: {
    label: "Long Signals",
    color: "hsl(270, 80%, 60%)", // Purple gradient - lighter
  },
  shortSignals: {
    label: "Short Signals",
    color: "hsl(280, 70%, 45%)", // Purple gradient - darker
  },
} satisfies ChartConfig;

export function TradersPerformanceChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Signals Distribution</CardTitle>
        <CardDescription>
          Long vs Short signals for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={(props) => (
                <ChartTooltipContent {...props} indicator="dot" />
              )}
            />
            <Area
              dataKey="shortSignals"
              type="natural"
              fill="var(--color-shortSignals)"
              fillOpacity={0.4}
              stroke="var(--color-shortSignals)"
              stackId="a"
            />
            <Area
              dataKey="longSignals"
              type="natural"
              fill="var(--color-longSignals)"
              fillOpacity={0.4}
              stroke="var(--color-longSignals)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 15.3% this month <TrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              January - June 2025
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
