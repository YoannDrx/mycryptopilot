"use client";

import { Button } from "@/components/ui/button";
import { acceptInvitationByTokenAction } from "@/features/invitation/invitation.action";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AcceptInvitationButtonProps = {
  token: string;
  traderId: string;
  traderName: string;
};

export const AcceptInvitationButton = ({
  token,
  traderId: _traderId,
  traderName,
}: AcceptInvitationButtonProps) => {
  const router = useRouter();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const result = await acceptInvitationByTokenAction({ token });

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to accept invitation");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success(`You're now following ${traderName}!`);
      // Redirect to user dashboard where they can see signals from followed traders
      router.push("/risk-console");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Button
      size="lg"
      onClick={() => acceptMutation.mutate()}
      disabled={acceptMutation.isPending}
      className="w-full"
    >
      {acceptMutation.isPending ? "Accepting..." : `Follow ${traderName}`}
    </Button>
  );
};
