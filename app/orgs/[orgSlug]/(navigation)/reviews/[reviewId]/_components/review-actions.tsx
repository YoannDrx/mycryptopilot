"use client";

import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateReviewAction } from "../action";

type Props = {
  reviewId: string;
};

export function ReviewActions({ reviewId }: Props) {
  const approveMutation = useMutation({
    mutationFn: async () => {
      return resolveActionResult(
        updateReviewAction({
          reviewId,
          status: "APPROVED",
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Review approved successfully");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return resolveActionResult(
        updateReviewAction({
          reviewId,
          status: "REJECTED",
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Review rejected successfully");
    },
  });

  return (
    <div className="flex gap-2">
      <Button
        variant="destructive"
        onClick={() => rejectMutation.mutate()}
        disabled={rejectMutation.isPending || approveMutation.isPending}
      >
        Reject
      </Button>
      <Button
        onClick={() => approveMutation.mutate()}
        disabled={rejectMutation.isPending || approveMutation.isPending}
      >
        Approve
      </Button>
    </div>
  );
}
