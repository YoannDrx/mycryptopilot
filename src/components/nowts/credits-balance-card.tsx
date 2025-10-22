"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Coins, TrendingUp, TrendingDown, Award, History } from "lucide-react";

export type CreditsBalanceCardProps = {
  balance: number;
  earned: number;
  spent: number;
  onViewCatalog?: () => void;
  onViewHistory?: () => void;
  className?: string;
};

export const CreditsBalanceCard = ({
  balance,
  earned,
  spent,
  onViewCatalog,
  onViewHistory,
  className,
}: CreditsBalanceCardProps) => {
  const hasCredits = balance > 0;
  const balanceColor = hasCredits
    ? "text-green-600"
    : balance === 0
      ? "text-gray-600"
      : "text-red-600";

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:shadow-md",
        hasCredits ? "border-green-200" : "border-gray-200",
        className,
      )}
    >
      <CardHeader
        className={cn("pb-3", hasCredits ? "bg-green-50" : "bg-gray-50")}
      >
        <div className="flex items-start justify-between">
          {/* Title & Icon */}
          <div className="flex items-center gap-2">
            <Coins className={cn("size-5", balanceColor)} />
            <CardTitle className="text-lg">Referral Credits</CardTitle>
          </div>

          {/* Balance Badge */}
          <Badge
            variant={hasCredits ? "default" : "secondary"}
            className="text-lg font-bold"
          >
            {balance} credits
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Earned */}
          <div className="flex items-center gap-2 rounded-lg border bg-green-50/50 p-3">
            <TrendingUp className="size-5 text-green-600" />
            <div>
              <p className="text-muted-foreground text-xs">Total Earned</p>
              <p className="text-lg font-bold text-green-600">+{earned}</p>
            </div>
          </div>

          {/* Spent */}
          <div className="flex items-center gap-2 rounded-lg border bg-amber-50/50 p-3">
            <TrendingDown className="size-5 text-amber-600" />
            <div>
              <p className="text-muted-foreground text-xs">Total Spent</p>
              <p className="text-lg font-bold text-amber-600">-{spent}</p>
            </div>
          </div>
        </div>

        {/* How to earn credits */}
        {balance === 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="mb-2 text-sm font-medium text-blue-900">
              How to earn credits?
            </p>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• Invite users (+5 credits per signup)</li>
              <li>• 30 days active (+10 credits)</li>
              <li>• User upgrades to Pro (+50 credits)</li>
              <li>• User upgrades to Ultra (+100 credits)</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onViewCatalog && (
            <Button
              onClick={onViewCatalog}
              variant={hasCredits ? "default" : "outline"}
              className="flex-1"
              disabled={!hasCredits}
            >
              <Award className="mr-2 size-4" />
              Rewards Catalog
            </Button>
          )}

          {onViewHistory && (
            <Button
              onClick={onViewHistory}
              variant="outline"
              className="flex-1"
            >
              <History className="mr-2 size-4" />
              History
            </Button>
          )}
        </div>

        {/* Warning if low balance */}
        {balance > 0 && balance < 50 && (
          <p className="text-muted-foreground text-center text-xs">
            You need at least 50 credits to redeem rewards
          </p>
        )}
      </CardContent>
    </Card>
  );
};
