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
  traderId: string;
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

type TraderSignalsDisplayProps = {
  signals: Signal[];
  traderDisplayName: string;
  userPlan?: string | null;
};

/**
 * Client component qui affiche les signaux d'un trader en cards ou en table
 * selon la préférence stockée dans le store Zustand global
 *
 * Réutilise les mêmes composants que /signals pour cohérence UX
 */
export function TraderSignalsDisplay({
  signals,
  traderDisplayName,
  userPlan,
}: TraderSignalsDisplayProps) {
  const { viewMode } = useSignalsViewState();

  if (viewMode === "table") {
    return <SignalsTableView signals={signals} userPlan={userPlan} />;
  }

  // Cards view (default)
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => (
        <TradingCard
          key={signal.id}
          symbol={signal.symbol}
          payload={signal.payloadJson}
          traderId={signal.traderId}
          traderName={traderDisplayName}
          createdAt={signal.createdAt}
          expiresAt={signal.expiresAt}
        />
      ))}
    </div>
  );
}
