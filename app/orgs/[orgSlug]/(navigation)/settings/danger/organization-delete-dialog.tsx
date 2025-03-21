"use client";

import { Button } from "@/components/ui/button";
import { dialogManager } from "@/features/dialog-manager/dialog-manager-store";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const OrganizationDeleteDialog = ({
  org,
}: {
  org: { id: string; slug: string };
}) => {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      return unwrapSafePromise(
        authClient.organization.delete({
          organizationId: org.id,
        }),
      );
    },
    onError: (error) => {
      toast.error("Error deleting organization", {
        description: error.message,
      });
    },
    onSuccess: () => {
      toast.success("Organization deleted", {
        description: "Your organization has been deleted",
      });
      router.push("/orgs");
    },
  });

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => {
        dialogManager.add({
          style: "centered",
          icon: X,
          title: "Delete Organization",
          description: "Are you sure you want to delete your organization?",
          confirmText: org.slug,
          action: {
            label: "Delete",
            onClick: async () => {
              await mutation.mutateAsync();
            },
          },
        });
      }}
    >
      <Trash2 className="mr-2" size={16} />
      Delete Organization
    </Button>
  );
};
