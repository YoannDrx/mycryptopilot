"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { RiskConsoleCalculator } from "@/components/nowts/risk-console-calculator";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, History } from "lucide-react";
import Link from "next/link";
import type { SerializableRiskCalculation } from "@/features/risk-console/risk-console-queries";

export type RiskConsolePageContentProps = {
  planName: string;
  userPresets: SerializableRiskCalculation[];
};

export function RiskConsolePageContent({
  planName,
  userPresets,
}: RiskConsolePageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planLabel = `${planName.slice(0, 1).toUpperCase()}${planName.slice(1)}`;

  const handlePresetSaved = () => {
    // Refresh to get updated presets list
    router.refresh();
  };

  // Read URL parameters to populate calculator
  const urlCapital = searchParams.get("capital");
  const urlRiskPercent = searchParams.get("riskPercent");
  const urlEntryPrice = searchParams.get("entryPrice");
  const urlStopLoss = searchParams.get("stopLoss");
  const urlPositionType = searchParams.get("positionType");
  const urlSymbol = searchParams.get("symbol");
  const urlTakeProfits = searchParams.get("takeProfits");

  // Parse URL parameters for calculator defaults
  const defaultCapital = urlCapital ? Number(urlCapital) : undefined;
  const defaultRiskPercent = urlRiskPercent
    ? Number(urlRiskPercent)
    : undefined;
  const defaultEntryPrice = urlEntryPrice ? Number(urlEntryPrice) : undefined;
  const defaultStopLoss = urlStopLoss ? Number(urlStopLoss) : undefined;
  const defaultPositionType =
    urlPositionType === "LONG" || urlPositionType === "SHORT"
      ? urlPositionType
      : undefined;
  const defaultSymbol = urlSymbol ?? undefined;
  const defaultTargets = urlTakeProfits
    ? (() => {
        try {
          return JSON.parse(urlTakeProfits) as {
            price: number;
            allocation: number;
            label?: string;
          }[];
        } catch {
          return undefined;
        }
      })()
    : undefined;

  return (
    <div className="container max-w-5xl space-y-10 py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
              <Calculator className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Risk Console
              </h1>
              <p className="text-muted-foreground">
                Calculate position sizing, risk amount, and risk / reward ratios
                in seconds. This tool is available on the {planLabel} plan.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="risk-console/history">
              <History className="mr-2 size-4" />
              View History
            </Link>
          </Button>
        </div>

        <Separator />
      </div>

      <RiskConsoleCalculator
        description="Adjust your capital, entry, stop loss, and take profit to validate your setup before sending a signal."
        userPresets={userPresets}
        onPresetSaved={handlePresetSaved}
        defaultCapital={defaultCapital}
        defaultRiskPercent={defaultRiskPercent}
        defaultEntryPrice={defaultEntryPrice}
        defaultStopLoss={defaultStopLoss}
        defaultPositionType={defaultPositionType}
        defaultSymbol={defaultSymbol}
        defaultTargets={defaultTargets}
      />
    </div>
  );
}
