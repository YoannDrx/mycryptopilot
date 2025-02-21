"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewPageConfig } from "../../orgs/[orgSlug]/(navigation)/pages/_schema/page-config.schema";
import {
  type ReviewTextSchemaType,
  ReviewTextSchema,
} from "../_schema/review.schema";

type Props = {
  config: ReviewPageConfig;
  onSubmit: (data: ReviewTextSchemaType) => void;
  isLoading?: boolean;
};

export function ReviewStep({ config, onSubmit, isLoading }: Props) {
  const form = useZodForm({
    schema: ReviewTextSchema,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">{config.review.title}</h1>
        <p className="text-lg text-muted-foreground">
          {config.review.helpText}
        </p>
      </div>

      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    className="h-32"
                    placeholder="Write your review here..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {config.review.allowVideoReview && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full border-2"
              onClick={() => {
                // TODO: Implement video recording
              }}
            >
              Record a Video Review
            </Button>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {config.review.ctaLabelNext}
          </Button>
        </div>
      </Form>
    </div>
  );
}
