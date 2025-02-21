import { z } from "zod";

export const ReviewTextSchema = z.object({
  text: z.string().min(1, "Please provide a review"),
});

export const ReviewVideoSchema = z.object({
  videoId: z.string(),
  videoUrl: z.string(),
});

export const ReviewInfoSchema = z.object({
  authorName: z.string().min(1, "Please provide your name"),
  authorEmail: z.string().email("Please provide a valid email"),
  authorRole: z.string().optional(),
});

export type ReviewTextSchemaType = z.infer<typeof ReviewTextSchema>;
export type ReviewVideoSchemaType = z.infer<typeof ReviewVideoSchema>;
export type ReviewInfoSchemaType = z.infer<typeof ReviewInfoSchema>;

// Full schema used for the final submission
export const ReviewFormSchema = ReviewTextSchema.merge(
  ReviewVideoSchema.partial(),
).merge(ReviewInfoSchema);

export type ReviewFormSchemaType = z.infer<typeof ReviewFormSchema>;
