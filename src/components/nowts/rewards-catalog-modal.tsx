"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Crown,
  Zap,
  Star,
  BarChart3,
  TrendingUp,
  Award,
  Coins,
} from "lucide-react";
import { useState } from "react";

// Définition des rewards disponibles
type Reward = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  category: "subscription" | "features" | "visibility";
  popular?: boolean;
};

const REWARDS_CATALOG: Reward[] = [
  // Subscription rewards
  {
    id: "pro_month",
    name: "1 Month Pro Plan",
    description:
      "Get 30 days of Pro subscription (50 signals/day, 5 traders, risk console)",
    cost: 100,
    icon: Zap,
    category: "subscription",
    popular: true,
  },
  {
    id: "ultra_month",
    name: "1 Month Ultra Plan",
    description:
      "Get 30 days of Ultra subscription (unlimited signals, unlimited traders, advanced features)",
    cost: 200,
    icon: Crown,
    category: "subscription",
    popular: true,
  },

  // Features rewards
  {
    id: "analytics",
    name: "Premium Analytics",
    description:
      "Unlock advanced analytics dashboard for 30 days (performance tracking, followers insights)",
    cost: 30,
    icon: BarChart3,
    category: "features",
  },
  {
    id: "custom_badge",
    name: "Custom Badge",
    description:
      "Create and display a personalized badge on your trader profile (permanent)",
    cost: 150,
    icon: Award,
    category: "features",
  },

  // Visibility rewards
  {
    id: "featured",
    name: "Featured Placement",
    description:
      "Get featured on the marketplace homepage for 7 days (top visibility)",
    cost: 50,
    icon: Star,
    category: "visibility",
  },
  {
    id: "profile_boost",
    name: "Profile Boost",
    description:
      "2x visibility in search results for 14 days (appears higher in rankings)",
    cost: 75,
    icon: TrendingUp,
    category: "visibility",
  },
];

export type RewardsCatalogModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onRedeemReward?: (rewardId: string, cost: number) => void;
};

export const RewardsCatalogModal = ({
  open,
  onOpenChange,
  currentBalance,
  onRedeemReward,
}: RewardsCatalogModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredRewards =
    selectedCategory === "all"
      ? REWARDS_CATALOG
      : REWARDS_CATALOG.filter((r) => r.category === selectedCategory);

  const canAfford = (cost: number) => currentBalance >= cost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="size-6 text-amber-600" />
            Rewards Catalog
          </DialogTitle>
          <DialogDescription>
            Redeem your referral credits for exclusive rewards and benefits
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance */}
        <div className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-amber-50 to-amber-100 p-4">
          <div>
            <p className="text-muted-foreground text-sm">Your Balance</p>
            <p className="text-2xl font-bold text-amber-700">
              {currentBalance} credits
            </p>
          </div>
          <Coins className="size-12 text-amber-600 opacity-20" />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All Rewards
          </Button>
          <Button
            variant={
              selectedCategory === "subscription" ? "default" : "outline"
            }
            size="sm"
            onClick={() => setSelectedCategory("subscription")}
          >
            Subscriptions
          </Button>
          <Button
            variant={selectedCategory === "features" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("features")}
          >
            Features
          </Button>
          <Button
            variant={selectedCategory === "visibility" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("visibility")}
          >
            Visibility
          </Button>
        </div>

        {/* Rewards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRewards.map((reward) => {
            const Icon = reward.icon;
            const affordable = canAfford(reward.cost);

            return (
              <Card
                key={reward.id}
                className={cn(
                  "relative transition-all hover:shadow-md",
                  !affordable && "opacity-60",
                )}
              >
                {reward.popular && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600"
                  >
                    Popular
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="text-primary size-5" />
                      <CardTitle className="text-base">{reward.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {reward.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="size-4 text-amber-600" />
                    <span className="text-lg font-bold text-amber-700">
                      {reward.cost} credits
                    </span>
                  </div>

                  <Button
                    size="sm"
                    disabled={!affordable}
                    onClick={() => onRedeemReward?.(reward.id, reward.cost)}
                  >
                    {affordable ? "Redeem" : "Not enough"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRewards.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No rewards available in this category
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> Rewards are processed instantly. Make sure
            you have enough credits before redeeming. Credits will be deducted
            from your balance immediately.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
