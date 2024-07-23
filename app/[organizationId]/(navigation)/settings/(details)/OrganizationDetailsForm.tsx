"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormUnsavedBar } from "@/features/form/FormUnsavedBar";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrganizationDetailsAction } from "../organization.schema";
import {
  OrganizationDetailsFormSchema,
  type OrganizationDetailsFormSchemaType,
} from "../settings.schema";

type ProductFormProps = {
  defaultValues: OrganizationDetailsFormSchemaType;
};

export const OrganizationDetailsForm = ({
  defaultValues,
}: ProductFormProps) => {
  const form = useZodForm({
    schema: OrganizationDetailsFormSchema,
    defaultValues,
  });
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: OrganizationDetailsFormSchemaType) => {
      const result = await updateOrganizationDetailsAction(values);

      if (!result || result.serverError) {
        toast.error("Failed to update settings");
        throw new Error("Failed to update settings");
      }

      router.refresh();
      form.reset(result.data as OrganizationDetailsFormSchemaType);
    },
  });

  return (
    <FormUnsavedBar
      form={form}
      onSubmit={async (v) => mutation.mutateAsync(v)}
      className="flex w-full flex-col gap-6 lg:gap-8"
    >
      <Card>
        <CardHeader>
          <CardTitle>Organization's name</CardTitle>
          <CardDescription>
            Use your organization's name or your name if you don't have an
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Organization's email</CardTitle>
          <CardDescription>
            Use a valid email address to receive billing and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </FormUnsavedBar>
  );
};
