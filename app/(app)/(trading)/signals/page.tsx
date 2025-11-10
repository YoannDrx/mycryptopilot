import { Suspense } from "react";
import type { Metadata } from "next";
import { getSignalsFeed } from "@/features/signal/signal-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalsFeed } from "./signals-feed";
import { SignalsFilters } from "./signals-filters";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Signals Feed - MyCryptoPilot",
  description:
    "Browse all trading signals from verified traders. Filter by asset, direction, status, and more.",
};

type SignalsPageProps = {
  searchParams: Promise<{
    symbols?: string | string[];
    bias?: string;
    status?: string;
    traderName?: string;
    instrumentType?: string;
    verifiedOnly?: string;
    cursor?: string;
  }>;
};

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;

  // Parse filters for count
  const symbols = Array.isArray(params.symbols)
    ? params.symbols
    : params.symbols
      ? [params.symbols]
      : undefined;

  const bias =
    params.bias === "LONG" || params.bias === "SHORT" ? params.bias : undefined;

  const status =
    params.status === "ACTIVE" || params.status === "EXPIRED"
      ? params.status
      : undefined;

  const instrumentType =
    params.instrumentType === "SPOT" || params.instrumentType === "PERP"
      ? params.instrumentType
      : undefined;

  const verifiedOnly = params.verifiedOnly === "true";

  // Get total count for filters component
  const { items: countSignals } = await getSignalsFeed({
    symbols,
    bias,
    status,
    instrumentType,
    traderName: params.traderName,
    verifiedOnly,
    limit: 100, // Get more for accurate count
  });

  return (
    <>
      {/* Header */}
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <LayoutTitle>Signals Feed</LayoutTitle>
          <LayoutDescription>
            Browse all trading signals from our community of verified traders.
            Filter by asset, direction, and more.
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <SignalsFilters totalSignals={countSignals.length} />
          </CardContent>
        </Card>

        {/* Signals Feed */}
        <Suspense
          key={JSON.stringify(params)}
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <SignalsFeed searchParams={params} />
        </Suspense>
      </LayoutContent>
    </>
  );
}
