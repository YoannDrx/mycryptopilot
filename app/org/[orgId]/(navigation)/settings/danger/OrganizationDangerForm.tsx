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
import { formatId } from "@/lib/format/id";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrganizationDetailsAction } from "../org.action";
import { OrgDangerFormSchema, OrgDangerFormSchemaType } from "../org.schema";

type ProductFormProps = {
  defaultValues: OrgDangerFormSchemaType;
};

export const OrganizationDangerForm = ({ defaultValues }: ProductFormProps) => {
  const form = useZodForm({
    schema: OrgDangerFormSchema,
    defaultValues,
  });
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: OrgDangerFormSchemaType) => {
      const result = await updateOrganizationDetailsAction(values);

      if (!result || result.serverError) {
        toast.error("Failed to update settings");
        throw new Error("Failed to update settings");
      }

      router.refresh();
      form.reset(result.data as OrgDangerFormSchemaType);
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
          <CardTitle>Organization's id</CardTitle>
          <CardDescription>
            id is the unique identifier of your organization.
          </CardDescription>
          <CardDescription>
            It's used in all the URLs, if you change it, all your URLs will be
            broken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder=""
                    {...field}
                    onChange={(e) => {
                      const id = formatId(e.target.value);
                      field.onChange(id);
                    }}
                  />
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
