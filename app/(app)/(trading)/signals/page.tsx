import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignalsFeed } from "./signals-feed";
import { SignalsFilters } from "./signals-filters";
import { SignalsLoadingSkeleton } from "./signals-loading-skeleton";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { TrendingUp } from "lucide-react";
import { ViewToggle } from "@/components/signals/view-toggle";

export const metadata: Metadata = {
  title: "Signals Feed - MyCryptoPilot",
  description:
    "Browse all trading signals from verified traders. Filter by asset, direction, status, and more.",
};

// Force dynamic rendering to ensure filters work correctly
export const dynamic = "force-dynamic";

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
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <ViewToggle />
            </div>
          </CardHeader>
          <CardContent>
            <SignalsFilters />
          </CardContent>
        </Card>

        {/* Signals Feed */}
        <Suspense
          key={JSON.stringify(params)}
          fallback={<SignalsLoadingSkeleton />}
        >
          <SignalsFeed searchParams={params} />
        </Suspense>
      </LayoutContent>
    </>
  );
}
