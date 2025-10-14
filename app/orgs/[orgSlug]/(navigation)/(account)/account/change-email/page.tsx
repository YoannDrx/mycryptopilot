"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { authClient, useSession } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrentOrg } from "@app/orgs/[orgSlug]/use-current-org";

const ChangeEmailFormSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

type ChangeEmailFormType = z.infer<typeof ChangeEmailFormSchema>;

export default function ChangeEmailPage() {
  const router = useRouter();
  const session = useSession();
  const currentOrg = useCurrentOrg();

  const form = useZodForm({
    schema: ChangeEmailFormSchema,
    defaultValues: {
      newEmail: session.data?.user.email,
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (values: ChangeEmailFormType) => {
      return unwrapSafePromise(
        authClient.changeEmail({
          newEmail: values.newEmail,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Verification email sent. Please check your inbox.");
      const accountPath = currentOrg?.slug ? `/orgs/${currentOrg.slug}/account` : "/account";
      router.push(accountPath);
    },
  });

  function onSubmit(values: ChangeEmailFormType) {
    changeEmailMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
        <CardDescription>
          Enter your new email address. We'll send a verification link to
          confirm the change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="newEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="new-email@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LoadingButton
            loading={changeEmailMutation.isPending}
            type="submit"
            className="w-full"
          >
            Change Email
          </LoadingButton>
        </Form>
      </CardContent>
    </Card>
  );
}
