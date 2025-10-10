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
          ? "Mode trader activé"
          : "Mode trader désactivé. Votre profil reste visible.",
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
        <CardTitle>Mode Trader</CardTitle>
        <CardDescription>
          Activez le mode trader pour publier des signaux et gérer vos followers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTraderProfile ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Vous n&apos;avez pas encore de profil trader. Créez-en un pour
              commencer à partager vos signaux de trading.
            </p>
            <Link
              href="/account/become-trader"
              className={buttonVariants({ variant: "default" })}
            >
              Créer mon profil trader
            </Link>
          </div>
        ) : (
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Activer le mode trader</Label>
              <p className="text-muted-foreground text-sm">
                {isEnabled
                  ? "Vous pouvez publier des signaux et accéder au dashboard trader"
                  : "Votre profil trader reste visible mais vous ne pouvez pas publier de signaux"}
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
            <Link href="/account/become-trader">
              Modifier mon profil trader
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
