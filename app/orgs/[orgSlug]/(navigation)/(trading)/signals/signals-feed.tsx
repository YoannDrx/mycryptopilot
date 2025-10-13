import { TradingCard } from "@/components/nowts/trading-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSignalsFeed } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

type SignalsFeedProps = {
  orgSlug: string;
  searchParams: {
    symbols?: string | string[];
    bias?: string;
    status?: string;
    traderName?: string;
    instrumentType?: string;
    verifiedOnly?: string;
    cursor?: string;
  };
};

export const SignalsFeed = async ({
  orgSlug,
  searchParams,
}: SignalsFeedProps) => {
  // Parse filters from URL
  const symbols = Array.isArray(searchParams.symbols)
    ? searchParams.symbols
    : searchParams.symbols
      ? [searchParams.symbols]
      : undefined;

  const bias =
    searchParams.bias === "LONG" || searchParams.bias === "SHORT"
      ? searchParams.bias
      : undefined;

  const status =
    searchParams.status === "ACTIVE" || searchParams.status === "EXPIRED"
      ? searchParams.status
      : undefined;

  const instrumentType =
    searchParams.instrumentType === "SPOT" ||
    searchParams.instrumentType === "PERP"
      ? searchParams.instrumentType
      : undefined;

  const verifiedOnly = searchParams.verifiedOnly === "true";

  // Fetch signals with advanced filters
  const { items: signals, hasNextPage, nextCursor } = await getSignalsFeed({
    symbols,
    bias,
    status,
    instrumentType,
    traderName: searchParams.traderName,
    verifiedOnly,
    cursor: searchParams.cursor,
    limit: 12,
  });

  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            No Signals Found
          </CardTitle>
          <CardDescription>
            {symbols || bias || searchParams.traderName || status || instrumentType
              ? "Try adjusting your filters to see more results"
              : "No trading signals available at the moment"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm">
              Clear your filters or check back later for new signals from traders
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Signals grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {signals.map((signal) => {
          const traderName =
            signal.trader.traderProfile?.displayName ?? signal.trader.name;

          return (
            <Link
              key={signal.id}
              href={`/orgs/${orgSlug}/traders/${signal.trader.id}`}
              className="block transition-transform hover:scale-[1.02]"
            >
              <TradingCard
                symbol={signal.symbol}
                payload={signal.payloadJson as TradingCardPayloadType}
                traderName={traderName}
                expiresAt={signal.expiresAt}
                className="h-full"
              />
            </Link>
          );
        })}
      </div>

      {/* Load more button */}
      {hasNextPage && nextCursor && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={`?cursor=${nextCursor}`}>Load more signals</Link>
          </Button>
        </div>
      )}
    </div>
  );
};
