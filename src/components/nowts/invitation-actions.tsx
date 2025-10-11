"use client";

import { Button } from "@/components/ui/button";
import {
  deleteInvitationAction,
  resendInvitationAction,
} from "@/features/invitation/invitation.action";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type InvitationActionsProps = {
  invitationId: string;
  email: string;
  status: string;
};

export const InvitationActions = ({
  invitationId,
  email,
  status,
}: InvitationActionsProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteInvitationAction({ invitationId });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to delete invitation");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Invitation deleted");
      void queryClient.invalidateQueries({ queryKey: ["invitations"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resend mutation
  const resendMutation = useMutation({
    mutationFn: async () => {
      const result = await resendInvitationAction({ invitationId });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to resend invitation");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["invitations"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isDeleting = deleteMutation.isPending;
  const isResending = resendMutation.isPending;
  const canResend = status === "PENDING" || status === "EXPIRED";

  return (
    <div className="flex items-center gap-2">
      {/* Resend button - only for pending/expired */}
      {canResend && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => resendMutation.mutate()}
          disabled={isResending || isDeleting}
        >
          <Mail className="size-4" />
          {isResending ? "Sending..." : "Resend"}
        </Button>
      )}

      {/* Delete button with confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting || isResending}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the invitation sent to{" "}
              <strong>{email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
