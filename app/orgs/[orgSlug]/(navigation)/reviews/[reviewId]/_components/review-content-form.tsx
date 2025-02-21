"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { type Review } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { updateReviewAction } from "../action";

const ReviewContentSchema = z.object({
  text: z.string().optional(),
});

type Props = {
  review: Pick<Review, "id" | "text" | "status" | "videoUrl">;
};

export function ReviewContentForm({ review }: Props) {
  const form = useZodForm({
    schema: ReviewContentSchema,
    defaultValues: {
      text: review.text ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof ReviewContentSchema>) => {
      return resolveActionResult(
        updateReviewAction({
          reviewId: review.id,
          status: review.status,
          text: data.text ?? undefined,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Review content updated successfully");
    },
  });

  return (
    <Card className="flex-[2]">
      <CardHeader>
        <CardTitle>Review Content</CardTitle>
      </CardHeader>
      <CardContent>
        {review.videoUrl ? (
          <div className="text-sm text-muted-foreground">
            This is a video review. The content cannot be edited.
          </div>
        ) : (
          <Form
            form={form}
            onSubmit={async (data) => {
              mutation.mutate(data);
            }}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Text</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
        )}
      </CardContent>
    </Card>
  );
}
