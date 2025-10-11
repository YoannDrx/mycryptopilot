import { Suspense } from "react";
import { getRequiredCurrentOrg } from "@/lib/organizations/get-org";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalsFeed } from "./signals-feed";
import { SignalsFilters } from "./signals-filters";

type SignalsPageProps = {
  searchParams: Promise<{
    symbol?: string;
    bias?: "LONG" | "SHORT";
    status?: "ACTIVE" | "EXPIRED";
    trader?: string;
  }>;
};

export default async function SignalsPage({
  searchParams,
}: SignalsPageProps) {
  const org = await getRequiredCurrentOrg();
  const params = await searchParams;

  return (
    <div className="container space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Trading Signals</h1>
        <p className="text-muted-foreground mt-2">
          Browse all trading signals from verified traders
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <SignalsFilters orgSlug={org.slug} />
        </CardContent>
      </Card>

      {/* Signals Feed */}
      <Suspense
        key={JSON.stringify(params)}
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <SignalsFeed orgSlug={org.slug} searchParams={params} />
      </Suspense>
    </div>
  );
}
