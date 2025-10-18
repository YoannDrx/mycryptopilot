import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import { searchTraders } from "@/features/trader/trader-queries";
import { countTraderFollowers } from "@/features/follow/follow-queries";
import { FollowButton } from "@/components/nowts/follow-button";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { isFollowingTrader } from "@/features/follow/follow-queries";
import { countTotalSignalsByTrader } from "@/features/signal/signal-queries";
import Link from "next/link";
import { MarketplaceFilters } from "./_components/marketplace-filters";

export const metadata: Metadata = {
  title: "Traders Marketplace - MyCryptoPilot",
  description:
    "Discover and follow verified crypto traders. Access professional trading signals.",
};

type TradersMarketplacePageProps = {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    sort?: string;
    cursor?: string;
  }>;
};

export default async function TradersMarketplacePage({
  searchParams,
}: TradersMarketplacePageProps) {
  const params = await searchParams;
  const user = await getRequiredUser();

  // Parse search params
  const search = params.search;
  const filterValue = params.filter ?? "all";
  const sortValue = params.sort ?? "recent";
  const cursor = params.cursor;

  // Map filter to verified boolean
  const verified =
    filterValue === "verified"
      ? true
      : filterValue === "all"
        ? undefined
        : undefined;

  // Validate and map sort to allowed values
  const sortBy: "winrate" | "followers" | "signals" | "recent" | undefined =
    sortValue === "winrate" ||
    sortValue === "followers" ||
    sortValue === "signals" ||
    sortValue === "recent"
      ? sortValue
      : "recent";

  // Fetch traders with search, filters, and pagination
  const {
    items: traders,
    hasNextPage,
    nextCursor,
  } = await searchTraders({
    search,
    verified,
    sortBy,
    cursor,
    limit: 12,
  });

  // Count total traders and verified traders
  const totalTraders = traders.length;
  const verifiedTraders = traders.filter((t) => t.verified).length;

  // Fetch followers count, signals count, and isFollowing status for all traders in parallel
  const followersCountPromises = traders.map(async (trader) =>
    countTraderFollowers(trader.userId),
  );
  const signalsCountPromises = traders.map(async (trader) =>
    countTotalSignalsByTrader(trader.userId),
  );
  const isFollowingPromises = traders.map(async (trader) =>
    isFollowingTrader(user.id, trader.userId),
  );

  const [followersCounts, signalsCounts, isFollowingStatuses] =
    await Promise.all([
      Promise.all(followersCountPromises),
      Promise.all(signalsCountPromises),
      Promise.all(isFollowingPromises),
    ]);

  // Create a map for easy access
  const traderDataMap = new Map(
    traders.map((trader, index) => [
      trader.userId,
      {
        followersCount: followersCounts[index] ?? 0,
        signalsCount: signalsCounts[index] ?? 0,
        isFollowing: isFollowingStatuses[index] ?? false,
      },
    ]),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Traders Marketplace
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Discover professional crypto traders and follow their signals.
            Verified track records and transparent statistics.
          </p>
        </div>

        {/* Search and Filters */}
        <MarketplaceFilters
          defaultSearch={search}
          defaultFilter={filterValue}
          defaultSort={sortBy}
        />

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Traders
              </CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTraders}</div>
              <p className="text-muted-foreground text-xs">
                {totalTraders === 0
                  ? "Be the first!"
                  : "Publishing signals daily"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Traders
              </CardTitle>
              <CheckCircle2 className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedTraders}</div>
              <p className="text-muted-foreground text-xs">
                With proven track record
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Results</CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTraders}</div>
              <p className="text-muted-foreground text-xs">
                {search ? `Matching "${search}"` : "Total traders"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Traders List */}
        {traders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="text-muted-foreground mb-4 size-16 opacity-20" />
              <h3 className="mb-2 text-xl font-semibold">
                {search ? "No traders found" : "No traders yet"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {search
                  ? `No traders match "${search}". Try a different search term or adjust your filters.`
                  : "Be the first trader to join MyCryptoPilot! Create your trader profile and start sharing your trading signals with the community."}
              </p>
              <Button asChild>
                <Link href="/account/become-trader">Become a Trader</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            data-testid="traders-grid"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {traders.map((trader) => {
              const stats =
                (trader.statsJson as Record<
                  string,
                  number | string | boolean
                > | null) ?? {};
              const traderData = traderDataMap.get(trader.userId);
              const followersCount = traderData?.followersCount ?? 0;
              const signalsCount = traderData?.signalsCount ?? 0;
              const isFollowing = traderData?.isFollowing ?? false;

              return (
                <Card key={trader.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="size-16">
                        <AvatarImage
                          src={trader.user.image ?? undefined}
                          alt={trader.user.name}
                        />
                        <AvatarFallback>
                          {trader.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {trader.displayName}
                          </CardTitle>
                          {trader.verified && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="size-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {trader.user.name}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {trader.bio && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {trader.bio}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Win Rate
                        </p>
                        <p className="text-xl font-bold">
                          {typeof stats.winrate === "number"
                            ? `${stats.winrate.toFixed(1)}%`
                            : "--%"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Payoff</p>
                        <p className="text-xl font-bold">
                          {typeof stats.payoff === "number"
                            ? stats.payoff.toFixed(1)
                            : "--"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Followers
                        </p>
                        <p className="text-xl font-bold">{followersCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Signals</p>
                        <p className="text-xl font-bold">{signalsCount}</p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <FollowButton
                      traderId={trader.userId}
                      traderName={trader.displayName}
                      isFollowing={isFollowing}
                      variant="default"
                    />
                    <Button variant="outline" asChild>
                      <Link href={`/traders/${trader.userId}`}>
                        View Profile
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {(traders.length > 0 || cursor) && (
          <div className="flex justify-center gap-2">
            {cursor && (
              <Button variant="outline" asChild>
                <Link
                  href={{
                    pathname: "/traders",
                    query: {
                      ...(search && { search }),
                      ...(filterValue !== "all" && { filter: filterValue }),
                      ...(sortBy !== "recent" && { sort: sortBy }),
                    },
                  }}
                >
                  First Page
                </Link>
              </Button>
            )}
            {hasNextPage && nextCursor && (
              <Button variant="outline" asChild>
                <Link
                  href={{
                    pathname: "/traders",
                    query: {
                      ...(search && { search }),
                      ...(filterValue !== "all" && { filter: filterValue }),
                      ...(sortBy !== "recent" && { sort: sortBy }),
                      cursor: nextCursor,
                    },
                  }}
                >
                  Next Page
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* CTA Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Want to become a trader?</CardTitle>
            <CardDescription className="text-base">
              Share your trading expertise and earn from your followers
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="grid gap-4 text-center md:grid-cols-3">
              <div>
                <div className="mb-2 text-3xl font-bold">1</div>
                <p className="text-muted-foreground text-sm">
                  Create your trader profile
                </p>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold">2</div>
                <p className="text-muted-foreground text-sm">
                  Share quality trading signals
                </p>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold">3</div>
                <p className="text-muted-foreground text-sm">
                  Earn from your followers
                </p>
              </div>
            </div>
            <Button size="lg" className="mt-4" asChild>
              <Link href="/account/become-trader">Start Trading Today</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
