import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTopInvitees } from "@/features/invitation/invitation-queries";
import { Trophy, TrendingUp, Crown, Coins, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type TopInviteesCardProps = {
  traderId: string;
  className?: string;
};

const getMedalIcon = (index: number) => {
  switch (index) {
    case 0:
      return "🥇";
    case 1:
      return "🥈";
    case 2:
      return "🥉";
    default:
      return `#${index + 1}`;
  }
};

export const TopInviteesCard = async ({
  traderId,
  className,
}: TopInviteesCardProps) => {
  const topInvitees = await getTopInvitees(traderId, 5);

  const hasInvitees = topInvitees.length > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-600" />
          Top Invitees
        </CardTitle>
        <CardDescription>
          Your most valuable referrals ranked by credits earned
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {hasInvitees ? (
          <>
            {topInvitees.map((invitee, index) => {
              const isPro = invitee.plan === "pro";
              const isUltra = invitee.plan === "ultra";

              return (
                <div
                  key={invitee.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-sm",
                    index === 0 && "border-amber-300 bg-amber-50/50",
                    index === 1 && "border-gray-300 bg-gray-50/50",
                    index === 2 && "border-orange-300 bg-orange-50/50",
                  )}
                >
                  {/* Left: Rank + Email */}
                  <div className="flex flex-1 items-center gap-3">
                    {/* Medal/Rank */}
                    <span className="text-2xl">{getMedalIcon(index)}</span>

                    {/* Email + Status */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-medium">
                        {invitee.email}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {/* Active Badge */}
                        {invitee.isActive && (
                          <Badge
                            variant="default"
                            className="gap-1 bg-green-600 text-xs"
                          >
                            <TrendingUp className="size-3" />
                            Active {invitee.daysSinceSignup}d
                          </Badge>
                        )}

                        {/* Upgraded Badge */}
                        {invitee.isUpgraded && (
                          <Badge
                            variant="default"
                            className={cn(
                              "gap-1 text-xs",
                              isPro && "bg-blue-600",
                              isUltra && "bg-purple-600",
                            )}
                          >
                            {isUltra && <Crown className="size-3" />}
                            {invitee.plan?.toUpperCase()}
                          </Badge>
                        )}

                        {/* Days since signup if not active */}
                        {!invitee.isActive && invitee.daysSinceSignup > 0 && (
                          <span className="text-muted-foreground text-xs">
                            {invitee.daysSinceSignup}d ago
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Credits Earned */}
                  <div className="ml-4 flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <Coins className="size-4 text-amber-600" />
                      <span className="text-lg font-bold text-amber-700">
                        +{invitee.creditsEarned}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      credits
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="bg-muted mt-4 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Top 5</span>
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-amber-600" />
                  <span className="text-xl font-bold">
                    +
                    {topInvitees.reduce(
                      (sum, inv) => sum + inv.creditsEarned,
                      0,
                    )}
                  </span>
                  <span className="text-muted-foreground text-sm">credits</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-muted-foreground py-8 text-center">
            <Users className="mx-auto mb-4 size-12 opacity-20" />
            <p className="mb-2 font-medium">No invitees yet</p>
            <p className="text-sm">
              Start inviting users to build your leaderboard
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
