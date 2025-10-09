"use client";

import { TrendingUp } from "lucide-react";
import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

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
  { asset: "BTC", signals: 487, fill: "var(--color-btc)" },
  { asset: "ETH", signals: 342, fill: "var(--color-eth)" },
  { asset: "SOL", signals: 268, fill: "var(--color-sol)" },
  { asset: "AVAX", signals: 189, fill: "var(--color-avax)" },
  { asset: "Others", signals: 239, fill: "var(--color-others)" },
];

const chartConfig = {
  signals: {
    label: "Signals",
  },
  btc: {
    label: "BTC",
    color: "hsl(265, 85%, 65%)", // Purple gradient - lightest
  },
  eth: {
    label: "ETH",
    color: "hsl(270, 75%, 55%)", // Purple gradient - light
  },
  sol: {
    label: "SOL",
    color: "hsl(275, 70%, 50%)", // Purple gradient - medium
  },
  avax: {
    label: "AVAX",
    color: "hsl(280, 65%, 45%)", // Purple gradient - dark
  },
  others: {
    label: "Others",
    color: "hsl(285, 60%, 40%)", // Purple gradient - darkest
  },
} satisfies ChartConfig;

export function SignalsByAssetChart() {
  const totalSignals = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.signals, 0);
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Signals by Asset</CardTitle>
        <CardDescription>January - June 2025</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={(props) => <ChartTooltipContent hideLabel {...props} />}
            />
            <Pie
              data={chartData}
              dataKey="signals"
              nameKey="asset"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (
                    viewBox &&
                    "cx" in viewBox &&
                    "cy" in viewBox &&
                    viewBox.cx != null &&
                    viewBox.cy != null
                  ) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalSignals.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy + 24}
                          className="fill-muted-foreground"
                        >
                          Total Signals
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          BTC dominates with 31% of signals <TrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Distribution of trading signals across major assets
        </div>
      </CardFooter>
    </Card>
  );
}
