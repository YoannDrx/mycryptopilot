import { TradingCard } from "@/components/nowts/trading-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listSignals } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { BarChart3 } from "lucide-react";

type SignalsFeedProps = {
  orgSlug: string;
  searchParams?: {
    symbol?: string;
    bias?: "LONG" | "SHORT";
    status?: "ACTIVE" | "EXPIRED";
    trader?: string;
  };
};

export const SignalsFeed = async ({
  orgSlug: _orgSlug,
  searchParams,
}: SignalsFeedProps) => {
  // Fetch signals with filters from URL
  const signals = await listSignals({
    symbol: searchParams?.symbol,
    bias: searchParams?.bias,
    status: searchParams?.status ?? "ACTIVE", // Default to ACTIVE
    traderId: searchParams?.trader,
    limit: 20,
    includeExpired: searchParams?.status === "EXPIRED",
  });

  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Signals Found</CardTitle>
          <CardDescription>
            {searchParams?.symbol || searchParams?.bias || searchParams?.trader
              ? "Try adjusting your filters to see more results"
              : "No trading signals available at the moment"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-4 size-12 opacity-20" />
            <p className="mb-2 font-medium">No signals match your filters</p>
            <p className="text-sm">
              Clear your filters or check back later for new signals
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {signals.length} Signal{signals.length > 1 ? "s" : ""} Found
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {signals.map((signal) => {
          const traderName =
            signal.trader.traderProfile?.displayName ?? signal.trader.name;

          return (
            <TradingCard
              key={signal.id}
              symbol={signal.symbol}
              payload={signal.payloadJson as TradingCardPayloadType}
              traderId={signal.traderId}
              traderName={traderName}
              createdAt={signal.createdAt}
              expiresAt={signal.expiresAt}
            />
          );
        })}
      </div>
    </div>
  );
};
