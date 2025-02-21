"use client";

import { Button } from "@/components/ui/button";
import { alertDialog } from "@/features/alert-dialog/alert-dialog-store";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPageAction } from "../_actions/create-page.action";

export function CreatePageDialog() {
  const router = useRouter();
  const params = useParams();
  const slug = params.orgSlug as string;

  const handleCreate = () => {
    alertDialog.add({
      title: "Create Review Page",
      description: "Enter a name for your new review page",
      input: {
        label: "Name",
        placeholder: "e.g. Product Feedback",
      },
      action: {
        label: "Create",
        onClick: async (value) => {
          if (!value) return;

          try {
            const page = await resolveActionResult(
              createPageAction({ name: value }),
            );
            toast.success("Review page created!");
            router.push(`/orgs/${slug}/pages/${page.id}`);
          } catch (error) {
            if (error instanceof Error) {
              toast.error(error.message);
            }
          }
        },
      },
    });
  };

  return (
    <Button onClick={handleCreate} size="lg">
      Create New Page
    </Button>
  );
}
