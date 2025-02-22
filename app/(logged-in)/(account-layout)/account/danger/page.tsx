"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dialogManager } from "@/features/dialog-manager/dialog-manager-store";
import { toast } from "sonner";
import { accountAskDeletionAction } from "./delete-account.action";

export default function DeleteProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete your profile</CardTitle>
        <CardDescription>
          Deleting your account means that all your personal data will be
          permanently erased and your ongoing subscription will be terminated.
          Please be aware that this action is irreversible.
        </CardDescription>
        <CardDescription>
          Also, if you are the owner of an organization, the organization will
          be deleted and your subscription will be cancelled. All your data will
          be lost.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => {
            dialogManager.add({
              title: "Delete your account ?",
              description: "Are you sure you want to delete your profile?",
              action: {
                label: "Delete",
                onClick: async () => {
                  await accountAskDeletionAction();
                  toast.success("Your deletion has been asked.", {
                    description:
                      "Please check your email for further instructions.",
                  });
                },
              },
            });
          }}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
