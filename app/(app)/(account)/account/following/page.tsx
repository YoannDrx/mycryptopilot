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
import { getFollowedTraders } from "@/features/follow/follow-queries";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";

export default async function FollowingPage() {
  const user = await getRequiredUser();

  // Récupérer la liste des traders suivis
  const followedTraders = await getFollowedTraders(user.id);

  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Users className="size-5" />
        </div>
        <div>
          <LayoutTitle>Following</LayoutTitle>
          <LayoutDescription>
            Manage traders you follow and receive signals from
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        {followedTraders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No traders followed yet</CardTitle>
              <CardDescription>
                Visit the{" "}
                <Link href="/traders" className="text-primary underline">
                  traders marketplace
                </Link>{" "}
                to discover and follow professional traders.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {followedTraders.map((follow) => {
              const trader = follow.trader;
              const traderProfile = trader.traderProfile;

              if (!traderProfile) {
                return null;
              }

              const stats =
                (traderProfile.statsJson as Record<
                  string,
                  number | string | boolean
                > | null) ?? {};

              return (
                <Card key={follow.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="size-16">
                          <AvatarImage
                            src={trader.image ?? undefined}
                            alt={trader.name}
                          />
                          <AvatarFallback className="text-lg">
                            {trader.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/traders/${trader.id}`}
                              className="hover:underline"
                            >
                              <Typography variant="h3">
                                {traderProfile.displayName}
                              </Typography>
                            </Link>
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
                          <div className="flex flex-wrap gap-4 pt-1">
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
                                <span className="text-sm">
                                  Winrate: {stats.winrate}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bouton Unfollow */}
                      <FollowButton
                        traderId={trader.id}
                        traderName={traderProfile.displayName}
                        isFollowing={true}
                        variant="outline"
                      />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </LayoutContent>
    </>
  );
}
