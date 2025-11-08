"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggleTraderRoleAction } from "@/features/trader/trader.action";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type TraderModeToggleProps = {
  hasTraderProfile: boolean;
  currentRole: "USER" | "TRADER" | "BOTH";
};

/**
 * Trader Mode Toggle Component
 *
 * Big Bang (Issue #77 Phase 11) - Adapted for user-centric architecture
 * - Removed useCurrentOrg() hook
 * - Direct URLs (no /orgs/${slug} prefix)
 */
export const TraderModeToggle = ({
  hasTraderProfile,
  currentRole,
}: TraderModeToggleProps) => {
  const router = useRouter();
  const isTraderModeActive = currentRole === "TRADER" || currentRole === "BOTH";
  const [isEnabled, setIsEnabled] = useState(isTraderModeActive);

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const result = await toggleTraderRoleAction({ enabled });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to toggle trader mode");
      }

      return result.data;
    },
    onSuccess: (data) => {
      setIsEnabled(data.enabled);
      toast.success(
        data.enabled
          ? "Trader mode enabled"
          : "Trader mode disabled. Your profile remains visible.",
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      // Revert the switch on error
      setIsEnabled(!isEnabled);
    },
  });

  const handleToggle = async (checked: boolean) => {
    // Optimistic update
    setIsEnabled(checked);
    toggleMutation.mutate(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trader Mode</CardTitle>
        <CardDescription>
          Enable trader mode to publish signals and manage your followers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTraderProfile ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              You don&apos;t have a trader profile yet. Create one to start
              sharing your trading signals.
            </p>
            <Link
              href="/account/become-trader"
              className={buttonVariants({ variant: "default" })}
            >
              Create my trader profile
            </Link>
          </div>
        ) : (
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable trader mode</Label>
              <p className="text-muted-foreground text-sm">
                {isEnabled
                  ? "You can publish signals and access the trader dashboard"
                  : "Your trader profile remains visible but you cannot publish signals"}
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={toggleMutation.isPending}
            />
          </div>
        )}
      </CardContent>
      {hasTraderProfile && (
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/account/become-trader">Edit my trader profile</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
