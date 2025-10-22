import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getTierProgress,
  TIER_REQUIREMENTS,
} from "@/lib/referral/tier-service";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, Users, CheckCircle2 } from "lucide-react";

type TierProgressCardProps = {
  traderId: string;
  className?: string;
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case "BRONZE":
      return "text-orange-700 bg-orange-50 border-orange-300";
    case "SILVER":
      return "text-gray-700 bg-gray-50 border-gray-300";
    case "GOLD":
      return "text-yellow-700 bg-yellow-50 border-yellow-300";
    case "DIAMOND":
      return "text-purple-700 bg-purple-50 border-purple-300";
    default:
      return "text-gray-700 bg-gray-50 border-gray-300";
  }
};

const getTierIcon = (tier: string) => {
  switch (tier) {
    case "BRONZE":
      return "🥉";
    case "SILVER":
      return "🥈";
    case "GOLD":
      return "🥇";
    case "DIAMOND":
      return "💎";
    default:
      return "🏆";
  }
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return "bg-green-600";
  if (percentage >= 50) return "bg-blue-600";
  if (percentage >= 25) return "bg-yellow-600";
  return "bg-gray-400";
};

export const TierProgressCard = async ({
  traderId,
  className,
}: TierProgressCardProps) => {
  const progress = await getTierProgress(traderId);
  const currentTierRewards = TIER_REQUIREMENTS[progress.currentTier].rewards;
  const isMaxTier = progress.nextTier === null;

  return (
    <Card className={cn("", className)}>
      <CardHeader className={cn("pb-3", getTierColor(progress.currentTier))}>
        <div className="flex items-start justify-between">
          {/* Title & Current Tier */}
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="size-5" />
              Referral Tier
            </CardTitle>
            <CardDescription>Track your tier progression</CardDescription>
          </div>

          {/* Current Tier Badge */}
          <Badge
            variant="default"
            className={cn(
              "border-2 text-lg font-bold",
              getTierColor(progress.currentTier),
            )}
          >
            {getTierIcon(progress.currentTier)} {progress.currentTier}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Current Stats */}
        <div className="flex items-center justify-between rounded-lg border bg-gray-50/50 p-3">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-blue-600" />
            <span className="text-sm font-medium">Active Invitees</span>
          </div>
          <span className="text-2xl font-bold">{progress.currentCount}</span>
        </div>

        {/* Progress to Next Tier */}
        {!isMaxTier ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Progress to{" "}
                {progress.nextTier && getTierIcon(progress.nextTier)}{" "}
                {progress.nextTier}
              </span>
              <span className="text-muted-foreground">
                {progress.progressPercentage}%
              </span>
            </div>

            <Progress
              value={progress.progressPercentage}
              className="h-3"
              indicatorClassName={getProgressColor(progress.progressPercentage)}
            />

            <p className="text-muted-foreground text-xs">
              <TrendingUp className="mr-1 inline size-3" />
              {progress.remaining} more active invitees needed for{" "}
              {progress.nextTier}
            </p>
          </div>
        ) : (
          /* Max Tier Reached */
          <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
            <CheckCircle2 className="size-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">
                Max Tier Reached!
              </p>
              <p className="text-xs text-purple-700">
                You're at the highest tier level
              </p>
            </div>
          </div>
        )}

        {/* Current Tier Benefits */}
        <div className="rounded-lg border bg-blue-50/50 p-3">
          <p className="mb-2 text-sm font-medium text-blue-900">
            {currentTierRewards.badge} Benefits
          </p>
          <ul className="space-y-1">
            {currentTierRewards.benefits.map((benefit, index) => (
              <li key={index} className="text-xs text-blue-700">
                • {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Tier Preview */}
        {!isMaxTier && progress.nextTier && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-sm font-medium text-amber-900">
              {getTierIcon(progress.nextTier)} Next Tier:{" "}
              {TIER_REQUIREMENTS[progress.nextTier].rewards.badge}
            </p>
            <p className="mb-2 text-xs text-amber-700">
              {TIER_REQUIREMENTS[progress.nextTier].rewards.description}
            </p>
            <ul className="space-y-1">
              {TIER_REQUIREMENTS[progress.nextTier].rewards.benefits
                .slice(0, 2)
                .map((benefit, index) => (
                  <li key={index} className="text-xs text-amber-700">
                    • {benefit}
                  </li>
                ))}
              {TIER_REQUIREMENTS[progress.nextTier].rewards.benefits.length >
                2 && (
                <li className="text-xs font-medium text-amber-700">
                  +{" "}
                  {TIER_REQUIREMENTS[progress.nextTier].rewards.benefits
                    .length - 2}{" "}
                  more benefits
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
