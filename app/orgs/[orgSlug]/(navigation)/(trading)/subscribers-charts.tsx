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
  { month: "January", signals: 186, active: 142 },
  { month: "February", signals: 305, active: 234 },
  { month: "March", signals: 237, active: 189 },
  { month: "April", signals: 273, active: 208 },
  { month: "May", signals: 309, active: 241 },
  { month: "June", signals: 342, active: 278 },
];

const chartConfig = {
  signals: {
    label: "Total Signals",
    color: "hsl(270, 80%, 60%)", // Purple gradient - lighter
  },
  active: {
    label: "Active Signals",
    color: "hsl(280, 70%, 45%)", // Purple gradient - darker
  },
} satisfies ChartConfig;

export function SubscribersChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Signals Activity</CardTitle>
        <CardDescription>
          Showing total and active signals for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="signals-chart"
          className="h-64 w-full"
          config={chartConfig}
        >
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
              content={(props) => <ChartTooltipContent {...props} />}
            />
            <defs>
              <linearGradient id="fillSignals" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-signals)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-signals)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="active"
              type="natural"
              fill="url(#fillActive)"
              fillOpacity={0.4}
              stroke="var(--color-active)"
              stackId="a"
            />
            <Area
              dataKey="signals"
              type="natural"
              fill="url(#fillSignals)"
              fillOpacity={0.4}
              stroke="var(--color-signals)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 18.2% this month <TrendingUp className="size-4" />
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
