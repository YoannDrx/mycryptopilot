"use client";

import { Button } from "@/components/ui/button";
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
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { inviteUserInOrganizationAction } from "../org.action";

const Schema = z.object({
  email: z.string().email(),
});

type SchemaType = z.infer<typeof Schema>;

export const OrganizationInviteMemberForm = () => {
  const form = useZodForm({
    schema: Schema,
  });

  const mutation = useMutation({
    mutationFn: async (values: SchemaType) => {
      const result = await inviteUserInOrganizationAction(values);

      if (!result || result.serverError) {
        toast.error("Failed to update settings");
        throw new Error("Failed to update settings");
      }

      toast.success("Invitation sent");
    },
  });

  return (
    <Form
      form={form}
      onSubmit={async (v) => mutation.mutateAsync(v)}
      className="flex w-full items-end gap-2"
    >
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="demo@gmail.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">
        <Plus size={16} className="mr-2" />
        Add
      </Button>
    </Form>
  );
};
