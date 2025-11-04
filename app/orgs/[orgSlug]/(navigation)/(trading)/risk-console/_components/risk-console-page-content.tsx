"use client";

import { useState } from "react";

import {
  RiskConsoleCalculator,
  type RiskConsoleCalculatorResult,
} from "@/components/nowts/risk-console-calculator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type RiskConsolePageContentProps = {
  planName: string;
};

export function RiskConsolePageContent({ planName }: RiskConsolePageContentProps) {
  const [result, setResult] = useState<RiskConsoleCalculatorResult | null>(null);
  const planLabel = `${planName.slice(0, 1).toUpperCase()}${planName.slice(1)}`;

  return (
    <div className="container max-w-5xl space-y-10 py-10">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <Calculator className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Console</h1>
            <p className="text-muted-foreground">
              Calculate position sizing, risk amount, and risk / reward ratios in seconds.
              This tool is available on the {planLabel} plan.
            </p>
          </div>
        </div>

        <Separator />

        {result ? (
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="space-y-2 py-4">
                <p className="text-sm text-muted-foreground">Position</p>
                <Badge className="w-fit">
                  {result.positionType === "LONG" ? "Long" : "Short"}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 py-4">
                <p className="text-sm text-muted-foreground">Risk per trade</p>
                <p className="text-2xl font-semibold">
                  ${formatter.format(result.riskAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 py-4">
                <p className="text-sm text-muted-foreground">Recommended position</p>
                <p className="text-2xl font-semibold">
                  ${formatter.format(result.positionSize)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 py-4">
                <p className="text-sm text-muted-foreground">Risk / Reward</p>
                <p className="text-2xl font-semibold">
                  {result.isValidConfiguration
                    ? `1:${result.rrRatio.toFixed(2)}`
                    : "N/A"}
                </p>
                {result.isValidConfiguration ? (
                  <p className="text-muted-foreground text-xs">
                    Avg exit: ${formatter.format(result.averageTakeProfit)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <RiskConsoleCalculator
        onResultChange={setResult}
        description="Adjust your capital, entry, stop loss, and take profit to validate your setup before sending a signal."
      />
    </div>
  );
}
