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
import { Trophy, TrendingUp, Users } from "lucide-react";

type TierProgressCardProps = {
  traderId: string;
  className?: string;
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

const getTierBadgeColor = (tier: string) => {
  switch (tier) {
    case "BRONZE":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300";
    case "SILVER":
      return "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    case "GOLD":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300";
    case "DIAMOND":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

export const TierProgressCard = async ({
  traderId,
  className,
}: TierProgressCardProps) => {
  const progress = await getTierProgress(traderId);
  const currentTierRewards = TIER_REQUIREMENTS[progress.currentTier].rewards;
  const isMaxTier = progress.nextTier === null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          {/* Title & Current Tier */}
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5" />
              Referral Tier
            </CardTitle>
            <CardDescription>Track your tier progression</CardDescription>
          </div>

          {/* Current Tier Badge */}
          <Badge
            variant="outline"
            className={`text-base font-bold ${getTierBadgeColor(progress.currentTier)}`}
          >
            {getTierIcon(progress.currentTier)} {progress.currentTier}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Stats */}
        <div className="bg-muted flex items-center justify-between rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="size-5" />
            <span className="text-sm font-medium">Active Invitees</span>
          </div>
          <span className="text-2xl font-bold">{progress.currentCount}</span>
        </div>

        {/* Progress to Next Tier */}
        {!isMaxTier && progress.nextTier ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Progress to {getTierIcon(progress.nextTier)} {progress.nextTier}
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
              {progress.remaining} more active invitees needed for SILVER
            </p>
          </div>
        ) : null}

        {/* Current Tier Benefits */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            {getTierIcon(progress.currentTier)} Bronze Benefits
          </p>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {currentTierRewards.benefits.map((benefit, index) => (
              <li key={index}>• {benefit}</li>
            ))}
          </ul>
        </div>

        {/* Next Tier Preview */}
        {!isMaxTier && progress.nextTier && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              {getTierIcon(progress.nextTier)} Next Tier:{" "}
              {getTierIcon(progress.nextTier)} Silver
            </p>
            <p className="text-muted-foreground mb-2 text-sm">
              {TIER_REQUIREMENTS[progress.nextTier].rewards.description}
            </p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {TIER_REQUIREMENTS[progress.nextTier].rewards.benefits
                .slice(0, 2)
                .map((benefit, index) => (
                  <li key={index}>• {benefit}</li>
                ))}
              {TIER_REQUIREMENTS[progress.nextTier].rewards.benefits.length >
                2 && (
                <li className="font-medium">
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
