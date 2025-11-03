"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/nowts/typography";
import { Calculator, TrendingUp } from "lucide-react";
import { useState } from "react";
import { SectionLayout } from "./section-layout";

export function RiskConsoleDemo() {
  const [capital, setCapital] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [entryPrice, setEntryPrice] = useState(42000);
  const [stopLoss, setStopLoss] = useState(41000);

  // Calculate position size using 2% rule
  const riskAmount = capital * (riskPercent / 100);
  const priceRisk = Math.abs(entryPrice - stopLoss);
  const priceRiskPercent = (priceRisk / entryPrice) * 100;
  const positionSize =
    priceRiskPercent > 0 ? riskAmount / (priceRiskPercent / 100) : 0;
  const contracts = entryPrice > 0 ? positionSize / entryPrice : 0;

  return (
    <SectionLayout size="lg" variant="card" containerClassName="py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: Explanation */}
        <div className="flex flex-col justify-center gap-6">
          <div className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-lg">
            <Calculator className="size-6" />
          </div>
          <Typography variant="h2" className="text-4xl font-bold">
            Avoid over-leverage before you even enter a trade
          </Typography>
          <Typography variant="large" className="text-muted-foreground">
            Our risk console automatically calculates your ideal position size
            based on the 2% rule—protecting your capital from devastating
            losses.
          </Typography>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary mt-1 flex size-6 shrink-0 items-center justify-center rounded-full">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold">
                  Real-time calculation
                </Typography>
                <Typography variant="muted">
                  Instantly see your position size as you adjust your risk
                  tolerance
                </Typography>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary mt-1 flex size-6 shrink-0 items-center justify-center rounded-full">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold">
                  2% Rule Protection
                </Typography>
                <Typography variant="muted">
                  Never risk more than 2% of your capital on a single trade
                </Typography>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary mt-1 flex size-6 shrink-0 items-center justify-center rounded-full">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold">
                  Free for everyone
                </Typography>
                <Typography variant="muted">
                  Access the risk console on all plans, including Free
                </Typography>
              </div>
            </div>
          </div>
          <Button size="lg" className="w-fit">
            Calculate My Exposure Now
          </Button>
        </div>

        {/* Right: Interactive Calculator */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="text-primary size-5" />
              Risk Console (2% Rule)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Capital Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="capital">Total Capital (USD)</Label>
              <Input
                id="capital"
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                placeholder="10000"
              />
            </div>

            {/* Risk Percent Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="risk">Risk Per Trade (%)</Label>
              <Input
                id="risk"
                type="number"
                min={1}
                max={5}
                step={0.5}
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                placeholder="2"
              />
              <Typography variant="muted" className="text-xs">
                Recommended: 1-2% for conservative, 2-3% for moderate
              </Typography>
            </div>

            {/* Entry Price */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="entry">Entry Price (USD)</Label>
              <Input
                id="entry"
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                placeholder="42000"
              />
            </div>

            {/* Stop Loss */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="stoploss">Stop Loss (USD)</Label>
              <Input
                id="stoploss"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                placeholder="41000"
              />
            </div>

            {/* Results */}
            <div className="bg-primary/10 flex flex-col gap-3 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Typography variant="small" className="text-muted-foreground">
                  Risk Amount:
                </Typography>
                <Typography
                  variant="large"
                  className="text-primary font-semibold"
                >
                  ${riskAmount.toFixed(2)}
                </Typography>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="small" className="text-muted-foreground">
                  Price Risk:
                </Typography>
                <Typography variant="large" className="font-semibold">
                  {priceRiskPercent.toFixed(2)}%
                </Typography>
              </div>
              <div className="border-border border-t pt-3">
                <div className="flex items-center justify-between">
                  <Typography variant="small" className="font-semibold">
                    Recommended Position:
                  </Typography>
                  <Typography variant="h3" className="text-primary">
                    ${positionSize.toFixed(2)}
                  </Typography>
                </div>
                <Typography variant="muted" className="mt-1 text-xs">
                  ≈ {contracts.toFixed(4)} contracts
                </Typography>
              </div>
            </div>

            <Typography variant="muted" className="text-center text-xs">
              💡 This calculation protects you from risking more than{" "}
              <span className="text-primary font-semibold">
                ${riskAmount.toFixed(2)}
              </span>{" "}
              if your stop loss is hit.
            </Typography>
          </CardContent>
        </Card>
      </div>
    </SectionLayout>
  );
}
