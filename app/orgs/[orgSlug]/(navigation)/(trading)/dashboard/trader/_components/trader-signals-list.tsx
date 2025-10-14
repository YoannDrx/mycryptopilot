import { TradingCard } from "@/components/nowts/trading-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSignalsByTraderId } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { BarChart3, PlusCircle } from "lucide-react";
import Link from "next/link";

type TraderSignalsListProps = {
  traderId: string;
};

export const TraderSignalsList = async ({
  traderId,
}: TraderSignalsListProps) => {
  const signals = await getSignalsByTraderId(traderId, {
    limit: 20,
    includeExpired: true, // Traders can see all their signals including expired ones
  });

  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Signals</CardTitle>
          <CardDescription>
            Signals you've published to your followers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-4 size-12 opacity-20" />
            <p className="mb-2 font-medium">No signals published yet</p>
            <p className="text-sm">
              Create your first trading signal to get started
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/trader/signals/new">
                <PlusCircle className="mr-2 size-4" />
                Create First Signal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSignals = signals.filter((s) => s.expiresAt > new Date());
  const expiredSignals = signals.filter((s) => s.expiresAt <= new Date());

  return (
    <div className="space-y-6">
      {/* Active Signals */}
      {activeSignals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Active Signals ({activeSignals.length})
            </h3>
            <Button asChild>
              <Link href="/dashboard/trader/signals/new">
                <PlusCircle className="mr-2 size-4" />
                Create New
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSignals.map((signal) => (
              <TradingCard
                key={signal.id}
                symbol={signal.symbol}
                payload={signal.payloadJson as TradingCardPayloadType}
                traderId={signal.traderId}
                traderName="You"
                createdAt={signal.createdAt}
                expiresAt={signal.expiresAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Signals */}
      {expiredSignals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-muted-foreground text-lg font-semibold">
            Expired Signals ({expiredSignals.length})
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiredSignals.map((signal) => (
              <TradingCard
                key={signal.id}
                symbol={signal.symbol}
                payload={signal.payloadJson as TradingCardPayloadType}
                traderId={signal.traderId}
                traderName="You"
                createdAt={signal.createdAt}
                expiresAt={signal.expiresAt}
                className="opacity-60"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
