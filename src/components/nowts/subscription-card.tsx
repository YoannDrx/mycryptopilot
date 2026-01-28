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
  const timeLeft = planExpiresAt
    ? planExpiresAt.getTime() - now.getTime()
    : null;
  const daysLeft = timeLeft
    ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = timeLeft !== null && timeLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  // Plan colors - Cyber Fintech theme
  const planColor = isUltra
    ? "text-[#a855f7]"
    : isPro
      ? "text-[#00ffaa]"
      : "text-[var(--text-secondary)]";
  const planBorderColor = isUltra
    ? "border-[#a855f7]/40 hover:border-[#a855f7]/60"
    : isPro
      ? "border-[#00ffaa]/40 hover:border-[#00ffaa]/60"
      : "border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]";
  const planGlow = isUltra
    ? "hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
    : isPro
      ? "hover:shadow-[0_0_20px_rgba(0,255,170,0.15)]"
      : "";

  return (
    <Card
      variant="hyper"
      className={cn(
        "border transition-all",
        planBorderColor,
        planGlow,
        isExpired && "opacity-60",
        className,
      )}
    >
      <CardHeader className="pb-3">
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
              <Badge variant="crimson">Expired</Badge>
            ) : isExpiringSoon ? (
              <Badge
                variant="glass"
                className="border-[#f59e0b]/40 text-[#f59e0b]"
              >
                Expiring Soon
              </Badge>
            ) : isFreePlan ? (
              <Badge variant="glass">Active</Badge>
            ) : (
              <Badge variant="emerald">Active</Badge>
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
          <div className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-[var(--text-muted)]" />
              <span className="text-[var(--text-muted)]">
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
          <div className="text-center text-sm text-[var(--text-secondary)]">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
          </div>
        )}

        {/* Features List */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Plan Features:</p>
          <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
            <li>
              <span className="text-[#00ffaa]">•</span>{" "}
              {planData.limits.activeSignalsLimit === 999
                ? "Unlimited"
                : planData.limits.activeSignalsLimit}{" "}
              active signals tracked
            </li>
            <li>
              <span className="text-[#00ffaa]">•</span> Follow up to{" "}
              {planData.limits.tradersFollow === -1
                ? "unlimited"
                : planData.limits.tradersFollow}{" "}
              {planData.limits.tradersFollow === 1 ? "trader" : "traders"}
            </li>
            <li>
              <span className="text-[#00ffaa]">•</span> Screener refresh:{" "}
              {planData.limits.screenerRefreshSec}s
            </li>
            {planData.limits.riskConsole && (
              <li>
                <span className="text-[#00ffaa]">•</span> Risk Console & Trading
                Journal
              </li>
            )}
            {planData.limits.customAlerts && (
              <li>
                <span className="text-[#00ffaa]">•</span> Custom Alerts &
                Advanced Filters
              </li>
            )}
          </ul>
        </div>

        {/* Upgrade CTA */}
        {showUpgradeButton && !isUltra && (
          <div className="pt-2">
            {isExpired || isFreePlan ? (
              <Link href="/pricing" className="w-full">
                <Button
                  className="w-full"
                  variant={isExpired ? "crimson" : "emerald"}
                >
                  {isExpired ? "Renew Subscription" : "Upgrade Plan"}
                </Button>
              </Link>
            ) : isExpiringSoon ? (
              <Link href="/pricing" className="w-full">
                <Button className="w-full" variant="glass">
                  Extend Subscription
                </Button>
              </Link>
            ) : null}
          </div>
        )}

        {/* Free Plan CTA */}
        {isFreePlan && showUpgradeButton && (
          <div className="rounded-lg border border-[var(--glass-border)] bg-gradient-to-r from-[#00ffaa]/5 to-[#a855f7]/5 p-3 text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Upgrade to unlock unlimited signals & advanced features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
