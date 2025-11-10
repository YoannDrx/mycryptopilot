"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TradingCard } from "@/components/nowts/trading-card";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";

type SignalDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signal: {
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
  userPlan?: string | null;
};

/**
 * Dialog modal affichant les détails complets d'un signal
 * Utilisé depuis la SignalsTableView au clic sur le bouton Actions
 */
export function SignalDetailDialog({
  open,
  onOpenChange,
  signal,
  userPlan,
}: SignalDetailDialogProps) {
  const traderName =
    signal.trader.traderProfile?.displayName ?? signal.trader.name ?? undefined;

  const now = new Date();
  const isExpired = signal.expiresAt < now;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Signal Details - {signal.symbol}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TradingCard
            symbol={signal.symbol}
            payload={signal.payloadJson}
            traderName={traderName}
            expiresAt={signal.expiresAt}
            createdAt={signal.createdAt}
            compact={false}
            signalId={signal.id}
            userPlan={userPlan}
            showCopyButton={!isExpired}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
