"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/SubmitButton";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { organizationDeleteAction } from "./delete-org.action";

const Schema = z
  .object({
    slug: z.string(),
    slugConfirm: z.string(),
  })
  .refine((data) => data.slugConfirm === data.slug, {
    message: "Slug is incorrect",
    path: ["slugConfirm"],
  });

// type SchemaType = z.infer<typeof Schema>;

export const OrganizationDeleteDialog = ({ organization }) => {
  const [open, setOpen] = useState(false);
  const form = useZodForm({
    schema: Schema,
    defaultValues: { slug: organization.slug, slugConfirm: "" },
  });
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await organizationDeleteAction();

      if (!result || result.serverError) {
        toast.error(result?.serverError ?? "Failed to delete orgnization");
        return;
      }

      router.refresh();
      toast.success("Organization deleted");
      setOpen(false);
      router.push("/org");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="mr-2" size={16} />
          Delete Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={async () => mutation.mutateAsync()}
          className="flex w-full flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="slugConfirm"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Organization Slug</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  This change is irreversible, so please be certain. Type in the
                  Organization slug{" "}
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {organization.slug}
                  </code>{" "}
                  and then press Delete.
                </FormDescription>
              </FormItem>
            )}
          />
          <LoadingButton
            loading={mutation.isPending}
            type="submit"
            className="mt-3"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </LoadingButton>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
