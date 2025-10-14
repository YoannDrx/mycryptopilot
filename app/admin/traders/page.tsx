import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { Suspense } from "react";
import { TraderFilters } from "./_components/trader-filters";
import { TradersTable } from "./_components/traders-table";

const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  verified: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(1),
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTradersPage({ searchParams }: PageProps) {
  await getRequiredAdmin();

  const params = await searchParamsCache.parse(searchParams);

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Trader Management</LayoutTitle>
        <LayoutDescription>
          View and manage all trader profiles, verify traders, and monitor their
          activity
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent>
        <div className="space-y-4">
          <TraderFilters />

          <Suspense fallback={<TraderTableSkeleton />}>
            <TradersTable searchParams={params} />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}

const TraderTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);
