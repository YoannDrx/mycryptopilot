"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MYCRYPTOPILOT_PLANS,
  type MyCryptoPilotPlanName,
} from "@/lib/crypto/mycryptopilot-plans";
import { Calendar, Crown, Zap } from "lucide-react";
import Link from "next/link";

export type SubscriptionCardProps = {
  plan: MyCryptoPilotPlanName;
  planExpiresAt?: Date | null;
  showUpgradeButton?: boolean;
  className?: string;
};

export const SubscriptionCard = ({
  plan,
  planExpiresAt,
  showUpgradeButton = true,
  className,
}: SubscriptionCardProps) => {
  const planData = MYCRYPTOPILOT_PLANS.find((p) => p.name === plan);

  if (!planData) {
    throw new Error(`Plan ${plan} not found in MYCRYPTOPILOT_PLANS`);
  }
  const isFreePlan = plan === "free";
  const isPro = plan === "pro";
  const isUltra = plan === "ultra";

  // Calculate days left
  const now = new Date();
  const timeLeft = planExpiresAt ? planExpiresAt.getTime() - now.getTime() : null;
  const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null;
  const isExpired = timeLeft !== null && timeLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  // Plan colors
  const planColor = isUltra
    ? "text-purple-600"
    : isPro
      ? "text-amber-600"
      : "text-gray-600";
  const planBgColor = isUltra
    ? "bg-purple-50"
    : isPro
      ? "bg-amber-50"
      : "bg-gray-50";
  const planBorderColor = isUltra
    ? "border-purple-200"
    : isPro
      ? "border-amber-200"
      : "border-gray-200";

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:shadow-md",
        planBorderColor,
        isExpired && "opacity-60",
        className,
      )}
    >
      <CardHeader className={cn("pb-3", planBgColor)}>
        <div className="flex items-start justify-between">
          {/* Plan Name & Icon */}
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-2 font-bold", planColor)}>
              {isUltra ? (
                <Crown className="size-5" />
              ) : isPro ? (
                <Zap className="size-5" />
              ) : (
                <Calendar className="size-5" />
              )}
              <span className="text-lg capitalize">{planData.name} Plan</span>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isExpired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : isExpiringSoon ? (
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                Expiring Soon
              </Badge>
            ) : isFreePlan ? (
              <Badge variant="secondary">Active</Badge>
            ) : (
              <Badge variant="default">Active</Badge>
            )}
          </div>
        </div>

        {/* Plan Price */}
        <div className={cn("text-sm font-medium", planColor)}>
          {isFreePlan ? (
            <span>Free Forever</span>
          ) : (
            <span>${planData.priceUSD}/month</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Expiration Info */}
        {!isFreePlan && planExpiresAt && (
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {isExpired ? "Expired on" : "Valid until"}
              </span>
            </div>
            <div className="text-sm font-semibold">
              {planExpiresAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        )}

        {/* Days Left (for non-free plans) */}
        {!isFreePlan && daysLeft !== null && !isExpired && (
          <div className="text-center text-sm text-muted-foreground">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
          </div>
        )}

        {/* Features List */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Plan Features:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              • {planData.limits.signalsPerDay === -1 ? "Unlimited" : planData.limits.signalsPerDay}{" "}
              signals per day
            </li>
            <li>
              • Follow up to{" "}
              {planData.limits.tradersFollow === -1 ? "unlimited" : planData.limits.tradersFollow}{" "}
              {planData.limits.tradersFollow === 1 ? "trader" : "traders"}
            </li>
            <li>
              • Screener refresh: {planData.limits.screenerRefreshSec}s
            </li>
            {planData.limits.riskConsole && <li>• Risk Console & Trading Journal</li>}
            {planData.limits.customAlerts && <li>• Custom Alerts & Advanced Filters</li>}
          </ul>
        </div>

        {/* Upgrade CTA */}
        {showUpgradeButton && !isUltra && (
          <div className="pt-2">
            {isExpired || isFreePlan ? (
              <Link href="/orgs/[orgSlug]/pricing" as="/pricing" className="w-full">
                <Button className="w-full" variant={isExpired ? "default" : "outline"}>
                  {isExpired ? "Renew Subscription" : "Upgrade Plan"}
                </Button>
              </Link>
            ) : isExpiringSoon ? (
              <Link href="/orgs/[orgSlug]/pricing" as="/pricing" className="w-full">
                <Button className="w-full" variant="outline">
                  Extend Subscription
                </Button>
              </Link>
            ) : null}
          </div>
        )}

        {/* Free Plan CTA */}
        {isFreePlan && showUpgradeButton && (
          <div className="rounded-lg bg-gradient-to-r from-amber-50 to-purple-50 p-3 text-center">
            <p className="text-sm font-medium text-gray-700">
              Upgrade to unlock unlimited signals & advanced features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
