"use server";

import { action } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ReviewFormSchema } from "../_schema/review.schema";

const Schema = z.object({
  pageId: z.string(),
  data: ReviewFormSchema,
});

export const submitReviewAction = action
  .schema(Schema)
  .action(async ({ parsedInput: input }) => {
    const page = await prisma.reviewPage.findUnique({
      where: {
        id: input.pageId,
      },
      select: {
        organizationId: true,
      },
    });

    if (!page) {
      throw new Error("Review page not found");
    }

    const review = await prisma.review.create({
      data: {
        pageId: input.pageId,
        organizationId: page.organizationId,
        text: input.data.text,
        authorName: input.data.authorName,
        authorEmail: input.data.authorEmail,
        authorRole: input.data.authorRole,
        videoId: input.data.videoId,
        videoUrl: input.data.videoUrl,
      },
    });

    return review;
  });
