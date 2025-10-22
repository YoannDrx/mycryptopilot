"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp } from "lucide-react";

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
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-5" />
          Referral Credits
        </CardTitle>
        <CardDescription>
          Earn and spend credits from your referrals
        </CardDescription>
        <CardAction>
          <div className="bg-primary text-primary-foreground rounded-lg px-3 py-1 text-lg font-bold">
            {balance} credits
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Overview */}
        <div className="bg-muted flex items-center justify-between rounded-lg p-4">
          <div>
            <div className="text-muted-foreground mb-1 text-sm">Balance</div>
            <p className="text-2xl font-bold">{balance} credits</p>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground mb-1 text-xs">
              Earned / Spent
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">+{earned}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-orange-600">-{spent}</span>
            </div>
          </div>
        </div>

        {/* How to earn credits */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            How to earn credits?
          </p>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>• Invite users (+5 credits per signup)</li>
            <li>• 30 days active (+10 credits)</li>
            <li>• User upgrades to Pro (+50 credits)</li>
            <li>• User upgrades to Ultra (+100 credits)</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onViewCatalog} variant="outline" className="flex-1">
            <DollarSign className="size-4" />
            Rewards Catalog
          </Button>
          <Button onClick={onViewHistory} variant="outline" className="flex-1">
            <TrendingUp className="size-4" />
            History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
