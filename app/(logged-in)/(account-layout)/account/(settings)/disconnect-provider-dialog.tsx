"use client";

import { LoadingButton } from "@/features/form/submit-button";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type DisconnectProviderDialogProps = {
  providerId: string;
  onSuccess: () => void;
};

export const DisconnectProviderDialog = ({
  providerId,
  onSuccess,
}: DisconnectProviderDialogProps) => {
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      // Note: Better Auth doesn't have a direct method to disconnect a provider
      // We need to delete the account from the database
      // This is a limitation of the current implementation
      // In a real scenario, you would need a server action to handle this

      // For now, we'll just show a message that this feature is not implemented
      throw new Error("Disconnect feature not implemented yet");
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => {
          // Empty function - dialog closing should be handled by parent
        }}
      >
        Cancel
      </Button>
      <LoadingButton
        variant="destructive"
        loading={disconnectMutation.isPending}
        onClick={() => void disconnectMutation.mutate()}
      >
        Disconnect {providerId}
      </LoadingButton>
    </div>
  );
};
