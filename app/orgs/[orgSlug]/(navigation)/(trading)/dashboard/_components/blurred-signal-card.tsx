"use client";

import { TradingCard } from "@/components/nowts/trading-card";
import { Button } from "@/components/ui/button";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type BlurredSignalCardProps = {
  signalId: string;
  symbol: string;
  payload: TradingCardPayloadType;
  traderId: string;
  traderName: string;
  createdAt: Date;
  expiresAt: Date;
  isBlurred: boolean;
  userPlan: string | null;
  showCopyButton: boolean;
};

/**
 * Wrapper around TradingCard that handles blurring for FREE plan users
 * Shows first N signals normally, then blurs remaining signals with upgrade CTA
 */
export function BlurredSignalCard({
  signalId,
  symbol,
  payload,
  traderId,
  traderName,
  createdAt,
  expiresAt,
  isBlurred,
  userPlan,
  showCopyButton,
}: BlurredSignalCardProps) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  if (!isBlurred) {
    // Normal signal display
    return (
      <TradingCard
        signalId={signalId}
        symbol={symbol}
        payload={payload}
        traderId={traderId}
        traderName={traderName}
        createdAt={createdAt}
        expiresAt={expiresAt}
        userPlan={userPlan}
        showCopyButton={showCopyButton}
      />
    );
  }

  // Blurred signal with upgrade CTA
  return (
    <div className="relative">
      {/* Blurred Trading Card */}
      <div className="pointer-events-none opacity-60 blur-sm select-none">
        <TradingCard
          symbol={symbol}
          payload={payload}
          traderId={traderId}
          traderName={traderName}
          createdAt={createdAt}
          expiresAt={expiresAt}
        />
      </div>

      {/* Upgrade CTA Overlay */}
      <div className="bg-background/80 border-primary/20 absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 backdrop-blur-sm">
        <div className="space-y-3 px-4 text-center">
          <Lock className="text-primary/60 mx-auto size-8" />
          <div>
            <p className="text-sm font-semibold">Unlock Premium Signals</p>
            <p className="text-muted-foreground text-xs">
              Upgrade to Pro to view all signals
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/orgs/${orgSlug}/pricing`}>
              Upgrade to Pro
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
