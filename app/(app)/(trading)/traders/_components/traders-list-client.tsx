"use client";

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
import { FollowButton } from "@/components/nowts/follow-button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { MarketplaceFilters } from "./marketplace-filters";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";

const filterOptions = ["all", "verified"] as const;
const sortOptions = ["recent", "winrate", "followers", "signals"] as const;

const marketplaceSearchParams = {
  search: parseAsString.withDefault(""),
  filter: parseAsStringLiteral(filterOptions).withDefault("all"),
  sort: parseAsStringLiteral(sortOptions).withDefault("recent"),
};

type Trader = {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  verified: boolean;
  statsJson: unknown;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

type TradersListClientProps = {
  initialData: {
    items: Trader[];
    hasNextPage: boolean;
    nextCursor: string | undefined;
  };
  userId: string;
};

export function TradersListClient({
  initialData,
  userId,
}: TradersListClientProps) {
  // URL state with nuqs (shallow: true = no navigation)
  const [filters] = useQueryStates(marketplaceSearchParams, {
    shallow: true,
  });

  // Fetch traders with TanStack Query
  const { data, isFetching } = useQuery({
    queryKey: ["traders", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.filter === "verified") params.set("verified", "true");
      if (filters.sort !== "recent") params.set("sort", filters.sort);

      const res = await fetch(`/api/traders/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch traders");
      return res.json() as Promise<typeof initialData>;
    },
    initialData, // Use SSR data for first render
  });

  const traders = data.items;
  const totalTraders = traders.length;
  const verifiedTraders = traders.filter((t) => t.verified).length;

  return (
    <>
      {/* Header */}
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Users className="size-5" />
        </div>
        <div>
          <LayoutTitle>Traders Marketplace</LayoutTitle>
          <LayoutDescription>
            Discover professional crypto traders and follow their signals.
            Verified track records and transparent statistics.
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent className="space-y-8">
        {/* Search and Filters */}
        <MarketplaceFilters
          defaultSearch={filters.search}
          defaultFilter={filters.filter}
          defaultSort={filters.sort}
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
                {filters.search
                  ? `Matching "${filters.search}"`
                  : "Total traders"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isFetching && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground flex items-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading traders...</span>
            </div>
          </div>
        )}

        {/* Traders List */}
        {!isFetching && traders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="text-muted-foreground mb-4 size-16 opacity-20" />
              <h3 className="mb-2 text-xl font-semibold">
                {filters.search ? "No traders found" : "No traders yet"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {filters.search
                  ? `No traders match "${filters.search}". Try a different search term or adjust your filters.`
                  : "Be the first trader to join MyCryptoPilot! Create your trader profile and start sharing your trading signals with the community."}
              </p>
              <Button asChild>
                <Link href="/account/become-trader">Become a Trader</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TradersList traders={traders} userId={userId} />
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
      </LayoutContent>
    </>
  );
}

type TradersListProps = {
  traders: Trader[];
  userId: string;
};

function TradersList({ traders, userId }: TradersListProps) {
  return (
    <div
      data-testid="traders-grid"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {traders.map((trader) => (
        <TraderCard key={trader.id} trader={trader} userId={userId} />
      ))}
    </div>
  );
}

type TraderCardProps = {
  trader: Trader;
  userId: string;
};

function TraderCard({ trader, userId }: TraderCardProps) {
  // Fetch trader data (followers, signals, isFollowing) via API routes
  const { data: followersCount } = useQuery({
    queryKey: ["trader-followers", trader.userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/follow/count-followers?traderId=${trader.userId}`,
      );
      if (!res.ok) return 0;
      const data = (await res.json()) as { count: number };
      return data.count;
    },
    initialData: 0,
  });

  const { data: signalsCount } = useQuery({
    queryKey: ["trader-signals", trader.userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/signals/count-by-trader?traderId=${trader.userId}`,
      );
      if (!res.ok) return 0;
      const data = (await res.json()) as { count: number };
      return data.count;
    },
    initialData: 0,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["is-following", userId, trader.userId],
    queryFn: async () => {
      const res = await fetch(
        `/api/follow/is-following?traderId=${trader.userId}`,
      );
      if (!res.ok) return false;
      const data = (await res.json()) as { isFollowing: boolean };
      return data.isFollowing;
    },
    initialData: false,
  });

  const stats =
    (trader.statsJson as Record<string, number | string | boolean> | null) ??
    {};

  return (
    <Card className="flex flex-col">
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
              <CardTitle className="text-lg">{trader.displayName}</CardTitle>
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
            <p className="text-muted-foreground text-xs">Win Rate</p>
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
            <p className="text-muted-foreground text-xs">Followers</p>
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
          userId={userId}
          variant="default"
        />
        <Button variant="outline" asChild>
          <Link href={`/traders/${trader.userId}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
