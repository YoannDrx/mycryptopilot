import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSignalsFeed } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { AlertCircle } from "lucide-react";
import { SignalsInfiniteScroll } from "./signals-infinite-scroll";

type SignalsFeedProps = {
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

export const SignalsFeed = async ({ searchParams }: SignalsFeedProps) => {
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
  const {
    items: signals,
    hasNextPage,
    nextCursor,
  } = await getSignalsFeed({
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
            {symbols ||
            bias ||
            searchParams.traderName ||
            status ||
            instrumentType
              ? "Try adjusting your filters to see more results"
              : "No trading signals available at the moment"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm">
              Clear your filters or check back later for new signals from
              traders
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SignalsInfiniteScroll
      initialSignals={signals.map((signal) => ({
        ...signal,
        payloadJson: signal.payloadJson as TradingCardPayloadType,
      }))}
      initialCursor={nextCursor ?? null}
      hasMore={hasNextPage}
      filters={{
        symbols,
        bias,
        status,
        instrumentType,
        traderName: searchParams.traderName,
        verifiedOnly,
      }}
    />
  );
};
