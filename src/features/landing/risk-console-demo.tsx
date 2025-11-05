"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/nowts/typography";
import { RiskConsoleCalculator } from "@/components/nowts/risk-console-calculator";
import { Calculator, TrendingUp } from "lucide-react";
import Link from "next/link";
import { SectionLayout } from "./section-layout";

export function RiskConsoleDemo() {
  return (
    <SectionLayout size="lg" variant="card" containerClassName="py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: Explanation */}
        <div className="flex flex-col justify-center gap-6">
          <div className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-lg">
            <Calculator className="size-6" />
          </div>
          <Typography variant="h2" className="text-4xl font-bold">
            Master your trade risk in a couple of clicks
          </Typography>
          <Typography variant="large" className="text-muted-foreground">
            Our risk console calculates your ideal position size, validates your
            Risk/Reward ratio, and keeps you aligned with the 2% rule—before you
            even enter the market.
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
                  Risk/Reward validation
                </Typography>
                <Typography variant="muted">
                  Catch invalid setups instantly with direction-aware RR logic
                </Typography>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary mt-1 flex size-6 shrink-0 items-center justify-center rounded-full">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <Typography variant="small" className="font-semibold">
                  Pro & Ultra exclusive
                </Typography>
                <Typography variant="muted">
                  Unlock the full risk console inside your account when you
                  upgrade
                </Typography>
              </div>
            </div>
          </div>
          <Button size="lg" className="w-fit" asChild>
            <Link href="/auth/signup">Start protecting your capital now</Link>
          </Button>
        </div>

        {/* Right: Interactive Calculator */}
        <div className="rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] shadow-xl">
          <RiskConsoleCalculator
            className="bg-card"
            heading={
              <span className="flex items-center gap-2">
                <Calculator className="text-primary size-5" />
                Risk Console (2% Rule)
              </span>
            }
          />
        </div>
      </div>
    </SectionLayout>
  );
}
