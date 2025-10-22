import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Coins,
  Users,
  TrendingDown,
} from "lucide-react";
import { getReferralEarnings } from "@/features/invitation/invitation-queries";

type ReferralEarningsCardProps = {
  traderId: string;
  className?: string;
};

export const ReferralEarningsCard = async ({
  traderId,
  className,
}: ReferralEarningsCardProps) => {
  const earnings = await getReferralEarnings(traderId);

  const hasEarnings =
    earnings.totalCreditsEarned > 0 || earnings.monthlyRevenue > 0;

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:shadow-md",
        hasEarnings ? "border-emerald-200" : "border-gray-200",
        className,
      )}
    >
      <CardHeader
        className={cn("pb-3", hasEarnings ? "bg-emerald-50" : "bg-gray-50")}
      >
        <div className="flex items-start justify-between">
          {/* Title & Icon */}
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign
                className={cn(
                  "size-5",
                  hasEarnings ? "text-emerald-600" : "text-gray-600",
                )}
              />
              Referral Earnings
            </CardTitle>
            <CardDescription>
              Track revenue impact from your invitations
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Credits Value */}
          <div className="flex flex-col gap-2 rounded-lg border bg-amber-50/50 p-3">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-amber-600" />
              <p className="text-muted-foreground text-xs">Credits Value</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-700">
                ${earnings.creditsValueUsd}
              </p>
              <p className="text-muted-foreground text-xs">
                {earnings.totalCreditsEarned} credits earned
              </p>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="flex flex-col gap-2 rounded-lg border bg-emerald-50/50 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              <p className="text-muted-foreground text-xs">Monthly Revenue</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">
                ${earnings.monthlyRevenue}
              </p>
              <p className="text-muted-foreground text-xs">
                {earnings.upgradedCount} paid followers
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        {earnings.upgradedCount > 0 && (
          <div className="space-y-2 rounded-lg border bg-gray-50/50 p-3">
            <p className="text-sm font-medium">Revenue Breakdown</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {earnings.breakdown.pro} Pro × $49
              </span>
              <span className="font-medium">
                ${earnings.breakdown.pro * 49}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {earnings.breakdown.ultra} Ultra × $99
              </span>
              <span className="font-medium">
                ${earnings.breakdown.ultra * 99}
              </span>
            </div>
          </div>
        )}

        {/* Potential Revenue */}
        {earnings.activeNotUpgradedCount > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <Users className="size-4 text-blue-600" />
              <div className="flex-1">
                <p className="mb-1 text-sm font-medium text-blue-900">
                  Potential Revenue
                </p>
                <p className="mb-2 text-xs text-blue-700">
                  {earnings.activeNotUpgradedCount} active invitees haven't
                  upgraded yet
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-blue-900">
                    +${earnings.potentialRevenue}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    /month potential
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasEarnings && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <TrendingDown className="mx-auto mb-2 size-8 text-gray-400" />
            <p className="mb-1 text-sm font-medium text-gray-700">
              No earnings yet
            </p>
            <p className="text-muted-foreground text-xs">
              Start inviting users to earn credits and revenue
            </p>
          </div>
        )}

        {/* Total Potential Impact */}
        {hasEarnings && (
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Value Impact</span>
              <div className="text-right">
                <p className="text-xl font-bold">
                  $
                  {earnings.creditsValueUsd +
                    earnings.monthlyRevenue +
                    earnings.potentialRevenue}
                </p>
                <p className="text-muted-foreground text-xs">
                  Current + Potential
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
