"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/SubmitButton";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { formatId } from "@/lib/format/id";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrganizationAction } from "./new-org.action";
import { NewOrganizationSchemaType, NewOrgsSchema } from "./new-org.schema";

export const NewOrganizationForm = () => {
  const form = useZodForm({
    schema: NewOrgsSchema,
  });
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: NewOrganizationSchemaType) => {
      const result = await createOrganizationAction(values);

      if (!isActionSuccessful(result)) {
        toast.error("Failed to update settings");
        throw new Error("Failed to update settings");
      }

      router.refresh();
      form.reset(result.data as NewOrganizationSchemaType);
      router.push(result.data.id);
    },
  });

  return (
    <Form
      form={form}
      onSubmit={async (v) => mutation.mutateAsync(v)}
      className="flex w-full flex-col gap-6 lg:gap-8"
    >
      <Card className="overflow-hidden bg-card">
        <CardContent className="mt-6 flex flex-col gap-4 lg:gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    className="input"
                    placeholder="Enter organization name"
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("id", formatId(e.target.value));
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization ID</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    className="input"
                    placeholder="Enter organization ID"
                    onChange={(e) => {
                      field.onChange(e);
                      form.setValue("id", formatId(e.target.value));
                    }}
                  />
                </FormControl>
                <FormDescription>
                  The organization ID is used to identify the organization, it
                  will be used in all the URLs.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className="input"
                    placeholder="Enter organization email"
                  />
                </FormControl>
                <FormDescription>
                  The billing email, will be used to send invoices, plan
                  reminders.
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border bg-background pt-6">
          <LoadingButton type="submit" size="lg">
            Create organization
          </LoadingButton>
        </CardFooter>
      </Card>
    </Form>
  );
};
