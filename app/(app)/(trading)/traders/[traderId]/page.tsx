import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowButton } from "@/components/nowts/follow-button";
import { Typography } from "@/components/nowts/typography";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { isFollowingTrader } from "@/features/follow/follow-queries";
import { countTraderFollowers } from "@/features/follow/follow-queries";
import { getUserWithTraderProfile } from "@/features/trader/trader-queries";
import { getSignalsByTraderId } from "@/features/signal/signal-queries";
import { countTotalSignalsByTrader } from "@/features/signal/signal-queries";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { LayoutContent } from "@/features/page/layout";
import { TraderProfileStats } from "./_components/trader-profile-stats";
import { ViewToggle } from "@/components/signals/view-toggle";
import { TraderSignalsDisplay } from "./_components/trader-signals-display";

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

  // Récupérer les compteurs initiaux (SSR) pour éviter les flash de contenu
  const [followersCount, signalsCount] = await Promise.all([
    countTraderFollowers(traderId),
    countTotalSignalsByTrader(traderId),
  ]);

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

                {/* Stats - Client Component pour mise à jour en temps réel */}
                <TraderProfileStats
                  traderId={traderId}
                  initialFollowersCount={followersCount}
                  initialSignalsCount={signalsCount}
                  winrate={
                    typeof stats.winrate === "number"
                      ? stats.winrate
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Bouton Follow/Unfollow */}
            <FollowButton
              traderId={traderId}
              traderName={traderProfile.displayName}
              isFollowing={isFollowing}
              userId={currentUser.id}
              size="lg"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Signaux récents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="large">Recent Signals</Typography>
            <Typography variant="muted">
              Latest trading signals from {traderProfile.displayName}
            </Typography>
          </div>
          {/* ViewToggle - Même pattern que /signals */}
          {signals.length > 0 && <ViewToggle />}
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
          <TraderSignalsDisplay
            signals={signals.map((signal) => ({
              ...signal,
              payloadJson: signal.payloadJson as TradingCardPayloadType,
            }))}
            traderDisplayName={traderProfile.displayName}
          />
        )}
      </div>
    </LayoutContent>
  );
}
