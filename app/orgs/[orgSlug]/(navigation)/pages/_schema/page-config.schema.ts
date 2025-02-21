import { z } from "zod";

export const PageConfigSchema = z.object({
  intro: z.object({
    title: z.string(),
    description: z.string(),
    videoUrl: z.string().nullable(),
    ctaLabel: z.string(),
  }),
  review: z.object({
    title: z.string(),
    helpText: z.string(),
    allowVideoReview: z.boolean(),
    ctaLabelNext: z.string(),
  }),
  info: z.object({
    title: z.string(),
    helpText: z.string(),
    ctaLabelNext: z.string(),
  }),
  thanks: z.object({
    title: z.string(),
    description: z.string(),
    ctaLabel: z.string(),
  }),
  primaryColor: z.string(),
  backgroundColor: z.string(),
});

export type ReviewPageConfig = z.infer<typeof PageConfigSchema>;

export const defaultPageConfig: ReviewPageConfig = {
  intro: {
    title: "Welcome to Our Review Page",
    description: "We appreciate your feedback...",
    videoUrl: null,
    ctaLabel: "Start My Review",
  },
  review: {
    title: "Your Thoughts",
    helpText: "Any comments or insights on the product?",
    allowVideoReview: true,
    ctaLabelNext: "Continue",
  },
  info: {
    title: "A Bit About You",
    helpText: "Tell us who you are so we can personalize things",
    ctaLabelNext: "Submit Info",
  },
  thanks: {
    title: "Thank You!",
    description:
      "We appreciate your time and will review your submission soon.",
    ctaLabel: "Finish",
  },
  primaryColor: "#000000",
  backgroundColor: "#FFFFFF",
};
