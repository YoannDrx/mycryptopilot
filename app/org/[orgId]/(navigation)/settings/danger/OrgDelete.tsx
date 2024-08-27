"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { alertDialog } from "@/features/alert-dialog/DialogProvider";
import { toast } from "sonner";
import { orgAskDeletionAction } from "./delete-org.action";

export const OrganizationDelete = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete the organization</CardTitle>
        <CardDescription>
          By deleting your organization, you will lose all your data and your
          subscription will be cancelled.
        </CardDescription>
        <CardDescription>No refund will be provided.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          variant="destructive"
          onClick={() => {
            alertDialog.add({
              title: "Delete your organization ?",
              description: "Are you sure you want to delete your organization?",
              action: {
                label: "Delete",
                onClick: async () => {
                  await orgAskDeletionAction();
                  toast.success("Your deletion has been asked.", {
                    description:
                      "Please check your email for further instructions.",
                  });
                },
              },
            });
          }}
        >
          Delete organization
        </Button>
      </CardFooter>
    </Card>
  );
};
