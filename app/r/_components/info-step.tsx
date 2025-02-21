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
import type { ReviewPageConfig } from "../../orgs/[orgSlug]/(navigation)/pages/_schema/page-config.schema";
import {
  type ReviewInfoSchemaType,
  ReviewInfoSchema,
} from "../_schema/review.schema";

type Props = {
  config: ReviewPageConfig;
  onSubmit: (data: ReviewInfoSchemaType) => void;
  isLoading?: boolean;
};

export function InfoStep({ config, onSubmit, isLoading }: Props) {
  const form = useZodForm({
    schema: ReviewInfoSchema,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">{config.info.title}</h1>
        <p className="text-lg text-muted-foreground">{config.info.helpText}</p>
      </div>

      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="authorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="authorEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@doe.com" {...field} />
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
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Input placeholder="CEO" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {config.info.ctaLabelNext}
          </Button>
        </div>
      </Form>
    </div>
  );
}
