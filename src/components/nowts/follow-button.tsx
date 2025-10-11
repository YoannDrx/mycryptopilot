"use client";

import { Button } from "@/components/ui/button";
import {
  followTraderAction,
  unfollowTraderAction,
} from "@/features/follow/follow.action";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FollowButtonProps = {
  traderId: string;
  traderName: string;
  isFollowing: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  onFollowSuccess?: () => void;
};

export const FollowButton = ({
  traderId,
  traderName,
  isFollowing,
  variant = "default",
  size = "default",
  onFollowSuccess,
}: FollowButtonProps) => {
  const queryClient = useQueryClient();
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  // Mutation pour suivre un trader
  const followMutation = useMutation({
    mutationFn: async () => {
      const result = await followTraderAction({ traderId });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to follow trader");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalider les queries pour rafraîchir les données
      void queryClient.invalidateQueries({ queryKey: ["traders"] });
      void queryClient.invalidateQueries({ queryKey: ["following"] });
      // Call custom success handler if provided
      if (onFollowSuccess) {
        onFollowSuccess();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour ne plus suivre un trader
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const result = await unfollowTraderAction({ traderId });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to unfollow trader");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalider les queries pour rafraîchir les données
      void queryClient.invalidateQueries({ queryKey: ["traders"] });
      void queryClient.invalidateQueries({ queryKey: ["following"] });
      setShowUnfollowDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setShowUnfollowDialog(false);
    },
  });

  const handleFollow = () => {
    followMutation.mutate();
  };

  const handleUnfollow = () => {
    setShowUnfollowDialog(true);
  };

  const confirmUnfollow = () => {
    unfollowMutation.mutate();
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <>
      {isFollowing ? (
        <Button
          onClick={handleUnfollow}
          disabled={isLoading}
          variant={variant}
          size={size}
        >
          {isLoading ? (
            <>Loading...</>
          ) : (
            <>
              <Check className="mr-2 size-4" />
              Following
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={handleFollow}
          disabled={isLoading}
          variant={variant}
          size={size}
        >
          {isLoading ? (
            <>Loading...</>
          ) : (
            <>
              <Plus className="mr-2 size-4" />
              Follow
            </>
          )}
        </Button>
      )}

      <AlertDialog
        open={showUnfollowDialog}
        onOpenChange={setShowUnfollowDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow {traderName}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop following {traderName}? You will no
              longer receive their trading signals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unfollowMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfollow}
              disabled={unfollowMutation.isPending}
            >
              {unfollowMutation.isPending ? "Unfollowing..." : "Unfollow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
