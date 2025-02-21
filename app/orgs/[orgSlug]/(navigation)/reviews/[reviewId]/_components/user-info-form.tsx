"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { type Review } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { updateReviewAction } from "../action";

const UserInfoSchema = z.object({
  authorName: z.string().min(1),
  authorRole: z.string().optional(),
});

type Props = {
  review: Pick<Review, "id" | "authorName" | "authorRole" | "status">;
};

export function UserInfoForm({ review }: Props) {
  const form = useZodForm({
    schema: UserInfoSchema,
    defaultValues: {
      authorName: review.authorName,
      authorRole: review.authorRole ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof UserInfoSchema>) => {
      return resolveActionResult(
        updateReviewAction({
          reviewId: review.id,
          status: review.status,
          ...data,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("User information updated successfully");
    },
  });

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant="outline">{review.status}</Badge>
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

            <LoadingButton type="submit" loading={mutation.isPending}>
              Save Changes
            </LoadingButton>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
