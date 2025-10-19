"use client";

import { TradingCard } from "@/components/nowts/trading-card";
import { Button } from "@/components/ui/button";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type BlurredSignalCardProps = {
  symbol: string;
  payload: TradingCardPayloadType;
  traderId: string;
  traderName: string;
  createdAt: Date;
  expiresAt: Date;
  isBlurred: boolean;
};

/**
 * Wrapper around TradingCard that handles blurring for FREE plan users
 * Shows first N signals normally, then blurs remaining signals with upgrade CTA
 */
export function BlurredSignalCard({
  symbol,
  payload,
  traderId,
  traderName,
  createdAt,
  expiresAt,
  isBlurred,
}: BlurredSignalCardProps) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  if (!isBlurred) {
    // Normal signal display
    return (
      <TradingCard
        symbol={symbol}
        payload={payload}
        traderId={traderId}
        traderName={traderName}
        createdAt={createdAt}
        expiresAt={expiresAt}
      />
    );
  }

  // Blurred signal with upgrade CTA
  return (
    <div className="relative">
      {/* Blurred Trading Card */}
      <div className="blur-sm opacity-60 pointer-events-none select-none">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-primary/20">
        <div className="text-center space-y-3 px-4">
          <Lock className="size-8 mx-auto text-primary/60" />
          <div>
            <p className="font-semibold text-sm">Unlock Premium Signals</p>
            <p className="text-xs text-muted-foreground">
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
