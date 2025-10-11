"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/submit-button";
import { inviteFollowerByEmailAction } from "@/features/invitation/invitation.action";
import {
  InviteFollowerSchema,
  type InviteFollowerType,
} from "@/features/invitation/invitation.schema";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type InviteFollowerDialogProps = {
  onInvitationSent?: () => void;
};

export const InviteFollowerDialog = ({
  onInvitationSent,
}: InviteFollowerDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useZodForm({
    schema: InviteFollowerSchema,
    defaultValues: {
      email: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFollowerType) => {
      const result = await inviteFollowerByEmailAction(values);

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to send invitation");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
      setOpen(false);
      void queryClient.invalidateQueries();
      // Wait for toast to be visible before reloading
      setTimeout(() => {
        window.location.reload(); // Hard refresh to update invitation list
      }, 500);
      onInvitationSent?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Mail className="mr-2 size-4" />
          Invite Follower
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Follower</DialogTitle>
          <DialogDescription>
            Send an email invitation to someone you'd like to share your trading
            signals with. They'll receive a link to follow you automatically.
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={(values) => inviteMutation.mutate(values)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="colleague@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" loading={inviteMutation.isPending}>
              Send Invitation
            </LoadingButton>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
