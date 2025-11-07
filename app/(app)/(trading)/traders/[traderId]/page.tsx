import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowButton } from "@/components/nowts/follow-button";
import { TradingCard } from "@/components/nowts/trading-card";
import { Typography } from "@/components/nowts/typography";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { isFollowingTrader } from "@/features/follow/follow-queries";
import { getUserWithTraderProfile } from "@/features/trader/trader-queries";
import { getSignalsByTraderId } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { LayoutContent } from "@/features/page/layout";

type TraderProfilePageProps = {
  params: Promise<{
    traderId: string;
  }>;
};

/**
 * Trader Profile Detail Page
 *
 * Big Bang (Issue #77 Phase 11) - Adapted for user-centric architecture
 * - Removed orgSlug param (no longer needed)
 */
export default async function TraderProfilePage({
  params,
}: TraderProfilePageProps) {
  const { traderId } = await params;
  const currentUser = await getRequiredUser();

  // Récupérer le profil trader
  const trader = await getUserWithTraderProfile(traderId);

  if (!trader?.traderProfile) {
    notFound();
  }

  // Vérifier si l'utilisateur suit déjà ce trader
  const isFollowing = await isFollowingTrader(currentUser.id, traderId);

  // Récupérer les signaux récents du trader
  const signals = await getSignalsByTraderId(traderId, {
    limit: 6,
    includeExpired: false,
  });

  const traderProfile = trader.traderProfile;
  const stats =
    (traderProfile.statsJson as Record<
      string,
      number | string | boolean
    > | null) ?? {};

  return (
    <LayoutContent className="space-y-8">
      {/* Header avec profil trader */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-20">
                <AvatarImage
                  src={trader.image ?? undefined}
                  alt={trader.name}
                />
                <AvatarFallback className="text-2xl">
                  {trader.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Typography variant="h1">
                    {traderProfile.displayName}
                  </Typography>
                  {traderProfile.verified && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                {traderProfile.bio && (
                  <Typography variant="muted" className="max-w-2xl">
                    {traderProfile.bio}
                  </Typography>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="text-muted-foreground size-4" />
                    <span className="text-sm">
                      {typeof stats.followers === "number"
                        ? stats.followers
                        : 0}{" "}
                      followers
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="text-muted-foreground size-4" />
                    <span className="text-sm">
                      {typeof stats.totalSignals === "number"
                        ? stats.totalSignals
                        : 0}{" "}
                      signals
                    </span>
                  </div>
                  {typeof stats.winrate === "number" && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">Winrate: {stats.winrate}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton Follow/Unfollow */}
            <FollowButton
              traderId={traderId}
              traderName={traderProfile.displayName}
              isFollowing={isFollowing}
              size="lg"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Signaux récents */}
      <div className="space-y-4">
        <div>
          <Typography variant="large">Recent Signals</Typography>
          <Typography variant="muted">
            Latest trading signals from {traderProfile.displayName}
          </Typography>
        </div>

        {signals.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No signals yet</CardTitle>
              <CardDescription>
                This trader hasn&apos;t published any signals yet. Follow them
                to be notified when they do!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {signals.map((signal) => (
              <TradingCard
                key={signal.id}
                symbol={signal.symbol}
                payload={signal.payloadJson as TradingCardPayloadType}
                traderId={signal.traderId}
                traderName={traderProfile.displayName}
                createdAt={signal.createdAt}
                expiresAt={signal.expiresAt}
              />
            ))}
          </div>
        )}
      </div>
    </LayoutContent>
  );
}
