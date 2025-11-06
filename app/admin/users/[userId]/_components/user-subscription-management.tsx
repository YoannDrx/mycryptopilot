"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { CalendarPlus, Crown, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  updateUserPlanAction,
  extendUserSubscriptionAction,
  resetUserToFreeAction,
} from "../_actions/subscription-admin.actions";

type UserSubscriptionManagementProps = {
  user: {
    id: string;
    name: string;
    planName: string | null;
    planExpiresAt: Date | null;
    userSubscription?: {
      plan: string;
      status: string;
      periodStart: Date | null;
      periodEnd: Date | null;
    } | null;
  };
};

export function UserSubscriptionManagement({
  user,
}: UserSubscriptionManagementProps) {
  const router = useRouter();
  const [updatePlanOpen, setUpdatePlanOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // Update Plan state
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "ultra">(
    "pro",
  );
  const [planDays, setPlanDays] = useState("30");

  // Extend Subscription state
  const [extendDays, setExtendDays] = useState("30");

  // Update Plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      const days = parseInt(planDays);
      if (isNaN(days) || days <= 0) {
        throw new Error("Days must be a positive number");
      }

      return updateUserPlanAction({
        userId: user.id,
        plan: selectedPlan,
        daysGranted: days,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`User plan updated to ${selectedPlan.toUpperCase()}`);
        setUpdatePlanOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update plan");
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });

  // Extend Subscription mutation
  const extendMutation = useMutation({
    mutationFn: async () => {
      const days = parseInt(extendDays);
      if (isNaN(days) || days <= 0) {
        throw new Error("Days must be a positive number");
      }

      return extendUserSubscriptionAction({
        userId: user.id,
        daysToAdd: days,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Subscription extended by ${extendDays} days`);
        setExtendOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to extend subscription");
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to extend subscription: ${error.message}`);
    },
  });

  // Reset to FREE mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return resetUserToFreeAction({
        userId: user.id,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("User reset to FREE plan");
        setResetOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reset to FREE");
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset to FREE: ${error.message}`);
    },
  });

  const currentPlan = user.planName ?? "free";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>
              Manage user plan and subscription dates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!user.userSubscription ? (
          <div className="text-muted-foreground py-4 text-center">
            No active subscription (Free plan)
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      user.userSubscription.status === "active"
                        ? "default"
                        : user.userSubscription.status === "canceled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {user.userSubscription.plan.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {user.userSubscription.status}
                  </span>
                </div>
                {user.userSubscription.periodStart && (
                  <div className="text-muted-foreground text-sm">
                    Period:{" "}
                    {new Date(
                      user.userSubscription.periodStart,
                    ).toLocaleDateString()}
                    {user.userSubscription.periodEnd &&
                      ` → ${new Date(user.userSubscription.periodEnd).toLocaleDateString()}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Update Plan Dialog */}
          <Dialog open={updatePlanOpen} onOpenChange={setUpdatePlanOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Crown className="mr-2 size-4" />
                Update Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update User Plan</DialogTitle>
                <DialogDescription>
                  Change {user.name}&apos;s plan and grant subscription days
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={selectedPlan}
                    onValueChange={(value) =>
                      setSelectedPlan(value as "free" | "pro" | "ultra")
                    }
                  >
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="days">Days Granted</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    value={planDays}
                    onChange={(e) => setPlanDays(e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-muted-foreground text-xs">
                    Number of days to grant for this plan
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUpdatePlanOpen(false)}
                  disabled={updatePlanMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updatePlanMutation.mutate()}
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Extend Subscription Dialog */}
          {currentPlan !== "free" && (
            <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarPlus className="mr-2 size-4" />
                  Extend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Extend Subscription</DialogTitle>
                  <DialogDescription>
                    Add days to {user.name}&apos;s current subscription
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="extend-days">Days to Add</Label>
                    <Input
                      id="extend-days"
                      type="number"
                      min="1"
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      placeholder="30"
                    />
                    <p className="text-muted-foreground text-xs">
                      Current plan: {currentPlan.toUpperCase()}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setExtendOpen(false)}
                    disabled={extendMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => extendMutation.mutate()}
                    disabled={extendMutation.isPending}
                  >
                    {extendMutation.isPending ? "Extending..." : "Extend"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Reset to FREE Dialog */}
          {currentPlan !== "free" && (
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <XCircle className="mr-2 size-4" />
                  Reset to FREE
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset to FREE Plan</DialogTitle>
                  <DialogDescription>
                    This will immediately downgrade {user.name} to the FREE plan
                    and cancel their subscription
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm">
                    Are you sure you want to reset this user to FREE? This
                    action will:
                  </p>
                  <ul className="text-muted-foreground mt-2 list-inside list-disc text-sm">
                    <li>Set plan to FREE</li>
                    <li>Cancel subscription status</li>
                    <li>Remove Discord premium role</li>
                    <li>Clear subscription period</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setResetOpen(false)}
                    disabled={resetMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? "Resetting..." : "Reset to FREE"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
