"use client";

import { TradingCard } from "@/components/nowts/trading-card";
import { SignalsTableView } from "@/components/signals/signals-table-view";
import { useSignalsViewState } from "@/stores/signals-view-state";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";

type Signal = {
  id: string;
  symbol: string;
  payloadJson: TradingCardPayloadType;
  createdAt: Date;
  expiresAt: Date;
  trader: {
    id: string;
    name: string | null;
    image: string | null;
    traderProfile: {
      displayName: string;
      verified: boolean;
    } | null;
  };
};

type SignalsFeedDisplayProps = {
  signals: Signal[];
};

/**
 * Client component qui affiche les signaux en cards ou en table
 * selon la préférence stockée dans Zustand
 */
export function SignalsFeedDisplay({ signals }: SignalsFeedDisplayProps) {
  const { viewMode } = useSignalsViewState();

  if (viewMode === "table") {
    // Note: userPlan will be undefined for now - can be added later if needed for Copy Trade in dialog
    return <SignalsTableView signals={signals} />;
  }

  // Cards view (default)
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => {
        const traderName =
          signal.trader.traderProfile?.displayName ??
          signal.trader.name ??
          undefined;

        return (
          <TradingCard
            key={signal.id}
            symbol={signal.symbol}
            payload={signal.payloadJson}
            traderName={traderName}
            expiresAt={signal.expiresAt}
            className="h-full"
            compact={true}
            showCopyButton={true}
          />
        );
      })}
    </div>
  );
}
