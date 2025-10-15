"use client";

import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization, Subscription, User } from "@/generated/prisma";
import {
  MYCRYPTOPILOT_PLANS,
  type MyCryptoPilotPlanName,
} from "@/lib/crypto/mycryptopilot-plans";
import { logger } from "@/lib/logger";
import { format } from "date-fns";
import { Calendar, Crown, Zap, Gift } from "lucide-react";
import { useState } from "react";
import {
  updatePlanAction,
  extendSubscriptionAction,
  resetToFreeAction,
} from "../_actions/crypto-subscription-admin.actions";

type OrganizationWithSubscription = Organization & {
  subscription: Subscription | null;
  members: {
    user: Pick<User, "id" | "email" | "name" | "planName" | "planExpiresAt">;
  }[];
};

export function OrganizationCryptoSubscription({
  organization,
}: {
  organization: OrganizationWithSubscription;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MyCryptoPilotPlanName>(
    (organization.subscription?.plan as MyCryptoPilotPlanName | undefined) ??
      "free",
  );
  const [daysToAdd, setDaysToAdd] = useState(30);

  const subscription = organization.subscription;
  const user = organization.members[0]?.user; // 1 org = 1 user in MyCryptoPilot

  if (typeof user === "undefined") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography variant="muted">
            No user found for this organization.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = MYCRYPTOPILOT_PLANS.find(
    (p) => p.name === (user.planName ?? "free"),
  );

  // Calculate status based on dates
  const now = new Date();
  const isExpired = user.planExpiresAt && new Date(user.planExpiresAt) < now;
  const daysLeft = user.planExpiresAt
    ? Math.ceil(
        (new Date(user.planExpiresAt).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const getStatusBadgeVariant = () => {
    if (!user.planExpiresAt) return "outline"; // Free plan
    if (isExpired) return "destructive";
    if (daysLeft && daysLeft <= 7) return "secondary";
    return "default";
  };

  const getStatusText = () => {
    if (!user.planExpiresAt) return "Free";
    if (isExpired) return "Expired";
    if (daysLeft && daysLeft <= 7) return `Expires in ${daysLeft} days`;
    return "Active";
  };

  const handleUpdatePlan = async () => {
    if (selectedPlan === user.planName) return;

    setIsUpdating(true);
    try {
      await updatePlanAction({
        userId: user.id,
        planName: selectedPlan,
        daysGranted: 30, // Default 1 month
      });
      window.location.reload();
    } catch (error) {
      logger.error("Failed to update plan:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (daysToAdd <= 0) return;

    setIsUpdating(true);
    try {
      await extendSubscriptionAction({
        userId: user.id,
        daysToAdd,
      });
      window.location.reload();
    } catch (error) {
      logger.error("Failed to extend subscription:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetToFree = async () => {
    if (!confirm("Are you sure you want to reset this user to Free plan?")) {
      return;
    }

    setIsUpdating(true);
    try {
      await resetToFreeAction({
        userId: user.id,
      });
      window.location.reload();
    } catch (error) {
      logger.error("Failed to reset to free:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Crypto Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Subscription Status */}
        <div className="space-y-3">
          <Typography variant="h3">Current Plan</Typography>
          <div className="flex items-center gap-4">
            <Typography variant="large" className="capitalize">
              {currentPlan?.name ?? "Free"} Plan
            </Typography>
            <Badge variant={getStatusBadgeVariant()}>{getStatusText()}</Badge>
          </div>

          <div className="grid gap-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Zap className="text-muted-foreground h-4 w-4" />
              <Typography variant="muted">
                Active signals limit: {currentPlan?.limits.activeSignalsLimit}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="text-muted-foreground h-4 w-4" />
              <Typography variant="muted">
                Traders to follow: {currentPlan?.limits.tradersFollow}
              </Typography>
            </div>
            {user.planExpiresAt && (
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <Typography variant="muted">
                  {isExpired ? "Expired on" : "Expires on"}{" "}
                  {format(new Date(user.planExpiresAt), "MMM dd, yyyy")}
                </Typography>
              </div>
            )}
            {daysLeft !== null && !isExpired && (
              <div className="flex items-center gap-2">
                <Gift className="text-muted-foreground h-4 w-4" />
                <Typography variant="muted">
                  {daysLeft} days remaining
                </Typography>
              </div>
            )}
          </div>

          {subscription?.stripeSubscriptionId && (
            <Typography variant="muted" className="text-xs">
              Note: This user has a legacy Stripe subscription. Crypto
              management will override it.
            </Typography>
          )}
        </div>

        {/* Plan Management */}
        <div className="space-y-3">
          <Typography variant="h3">Change Plan</Typography>
          <div className="flex items-center gap-3">
            <Select
              value={selectedPlan}
              onValueChange={(value) =>
                setSelectedPlan(value as MyCryptoPilotPlanName)
              }
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {MYCRYPTOPILOT_PLANS.map((plan) => (
                  <SelectItem key={plan.name} value={plan.name}>
                    <span className="font-medium capitalize">
                      {plan.name} - ${plan.priceUSD}/month
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleUpdatePlan}
              disabled={isUpdating || selectedPlan === user.planName}
              size="sm"
            >
              {isUpdating ? "Updating..." : "Update Plan"}
            </Button>
          </div>
          <Typography variant="muted" className="text-sm">
            This will grant 30 days of the selected plan from today.
          </Typography>
        </div>

        {/* Extend Subscription */}
        <div className="space-y-3">
          <Typography variant="h3">Extend Current Plan</Typography>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="days-to-add">Days to add:</Label>
              <Input
                id="days-to-add"
                type="number"
                min="1"
                max="365"
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(parseInt(e.target.value, 10))}
                className="w-24"
              />
            </div>
            <Button
              onClick={handleExtendSubscription}
              disabled={isUpdating || daysToAdd <= 0}
              size="sm"
              variant="outline"
            >
              {isUpdating ? "Extending..." : "Extend"}
            </Button>
          </div>
          <Typography variant="muted" className="text-sm">
            Add days to the current plan expiration date. Useful for refunds or
            compensation.
          </Typography>
        </div>

        {/* Reset to Free */}
        {user.planName !== "free" && (
          <div className="space-y-3">
            <Typography variant="h3">Reset to Free</Typography>
            <Button
              onClick={handleResetToFree}
              disabled={isUpdating}
              size="sm"
              variant="destructive"
            >
              {isUpdating ? "Resetting..." : "Reset to Free Plan"}
            </Button>
            <Typography variant="muted" className="text-sm">
              This will immediately downgrade the user to the Free plan and
              remove the expiration date.
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
