"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { RiskConsoleCalculator } from "@/components/nowts/risk-console-calculator";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, History } from "lucide-react";
import Link from "next/link";
import type { SerializableRiskCalculation } from "@/features/risk-console/risk-console-queries";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutActions,
  LayoutContent,
} from "@/features/page/layout";

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
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Calculator className="size-5" />
        </div>
        <div>
          <LayoutTitle>Risk Console</LayoutTitle>
          <LayoutDescription>
            Simulate position sizing, loss exposure and risk / reward before
            acting elsewhere. MyCryptoPilot never sends an order.
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutActions>
        <Button variant="outline" asChild>
          <Link href="risk-console/history">
            <History className="mr-2 size-4" />
            View History
          </Link>
        </Button>
      </LayoutActions>

      <LayoutContent>
        <Separator className="mb-10" />
        <RiskConsoleCalculator
          description={`Demo / Testnet · ${planName.toUpperCase()} account · Adjust capital, entry, stop loss and take profit to inspect a scenario. No order is created.`}
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
      </LayoutContent>
    </>
  );
}
