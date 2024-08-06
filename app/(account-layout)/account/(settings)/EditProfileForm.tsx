"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { InlineTooltip } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { LoadingButton } from "@/features/form/SubmitButton";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { logger } from "@/lib/logger";
import type { User } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { differenceInMinutes } from "date-fns";
import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  sendUpdateEmailVerificationCodeAction,
  updateProfileAction,
  verifyUpdateEmailTokenAction,
} from "./edit-profile.action";
import type { ProfileFormType } from "./edit-profile.schema";
import { ProfileFormSchema } from "./edit-profile.schema";

type EditProfileFormProps = {
  defaultValues: User;
};

export const EditProfileForm = ({ defaultValues }: EditProfileFormProps) => {
  const form = useZodForm({
    schema: ProfileFormSchema,
    defaultValues: defaultValues,
  });
  const router = useRouter();
  const [verification, setVerification] = useState({
    isDialogOpen: false,
    token: "",
  });

  const sendVerificationCodeMutation = useMutation({
    mutationFn: async () => {
      setVerification({
        isDialogOpen: true,
        token: "",
      });

      const result = await sendUpdateEmailVerificationCodeAction();

      if (!isActionSuccessful(result)) {
        logger.debug(result);
        setVerification({
          isDialogOpen: false,
          token: "",
        });
        toast.error("Failed to send email");
        return;
      }

      return Date.now();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormType) => {
      if (values.email !== defaultValues.email && verification.token === "") {
        sendVerificationCodeMutation.mutate();
        return;
      }

      const result = await updateProfileAction({
        ...values,
        token: verification.token,
      });

      if (!isActionSuccessful(result)) {
        toast.error(result?.serverError);
        return;
      }

      toast.success("Profile updated");
      router.refresh();
    },
  });

  return (
    <>
      <Form
        form={form}
        onSubmit={async (v) => updateProfileMutation.mutateAsync(v)}
        disabled={updateProfileMutation.isPending}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="" {...field} value={field.value ?? ""} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <span>Email</span>
                {defaultValues.emailVerified ? (
                  <InlineTooltip title="Email verified. If you change your email, you will need to verify it again.">
                    <BadgeCheck size={16} />
                  </InlineTooltip>
                ) : null}
              </FormLabel>
              <FormControl>
                <Input placeholder="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton
          loading={updateProfileMutation.isPending}
          className="w-fit self-end"
          size="sm"
        >
          Save
        </LoadingButton>
      </Form>
      <EmailVerificationDialog
        verification={verification}
        setVerification={setVerification}
        sendVerificationCodeMutation={sendVerificationCodeMutation}
      />
    </>
  );
};

type VerificationStateType = {
  isDialogOpen: boolean;
  token: string;
};

const EmailVerificationDialog = (props: {
  verification: VerificationStateType;
  setVerification: (verification: VerificationStateType) => void;
  sendVerificationCodeMutation: {
    mutateAsync: () => Promise<unknown>;
    isPending: boolean;
    data?: number;
  };
}) => {
  const verifyTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const result = await verifyUpdateEmailTokenAction({
        token,
      });

      if (!isActionSuccessful(result)) {
        toast.error(result?.serverError);
        return;
      }

      if (!result.data.valid) {
        toast.error("Invalid token");
        return;
      }

      toast.success("Email verified", {
        description: "Please submit again.",
      });

      props.setVerification({
        isDialogOpen: false,
        token,
      });
    },
  });

  return (
    <Dialog
      open={props.verification.isDialogOpen}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          props.setVerification({
            isDialogOpen: false,
            token: "",
          });
          toast.info("You cancelled the verification process.");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify your current email</DialogTitle>
          <DialogDescription>
            We have sent you a new email verification code.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex items-center gap-2"
          action={(formData) => {
            const token = formData.get("token") as string;

            verifyTokenMutation.mutate(token);
          }}
        >
          <Input name="token" placeholder="Verification code" />

          <LoadingButton loading={verifyTokenMutation.isPending} type="submit">
            Verify
          </LoadingButton>
        </form>
        <div className="flex items-center gap-2">
          <Typography variant="muted">Didn't receive the email ?</Typography>
          <LoadingButton
            variant="outline"
            className="ml-auto mt-2"
            loading={
              verifyTokenMutation.isPending ||
              props.sendVerificationCodeMutation.isPending
            }
            onClick={async () => {
              await props.sendVerificationCodeMutation.mutateAsync();
            }}
            disabled={
              props.sendVerificationCodeMutation.data
                ? differenceInMinutes(
                    new Date(),
                    new Date(props.sendVerificationCodeMutation.data),
                  ) < 1
                : false
            }
          >
            Resend
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
