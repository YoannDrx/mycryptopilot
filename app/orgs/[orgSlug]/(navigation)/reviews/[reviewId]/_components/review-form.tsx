"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { type Review } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { updateReviewAction } from "../action";

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

const Schema = z.object({
  authorName: z.string().min(1),
  authorRole: z.string().optional(),
  text: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

type Props = {
  review: Pick<Review, "id" | "authorName" | "authorRole" | "text" | "status">;
};

export function ReviewForm({ review }: Props) {
  const form = useZodForm({
    schema: Schema,
    defaultValues: {
      authorName: review.authorName,
      authorRole: review.authorRole ?? "",
      text: review.text ?? "",
      status: review.status,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof Schema>) => {
      return resolveActionResult(
        updateReviewAction({
          ...data,
          reviewId: review.id,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Review updated successfully");
    },
  });

  return (
    <Form
      form={form}
      onSubmit={async (data) => {
        mutation.mutate(data);
      }}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="authorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="authorRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author Role</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review Text</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(
                    value as (typeof statusOptions)[number]["value"],
                  )
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton type="submit" loading={mutation.isPending}>
          Save Changes
        </LoadingButton>
      </div>
    </Form>
  );
}
