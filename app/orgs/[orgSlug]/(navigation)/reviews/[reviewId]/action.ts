"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateReviewSchema = z.object({
  reviewId: z.string(),
  authorName: z.string().min(1).optional(),
  authorRole: z.string().optional(),
  text: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export const updateReviewAction = orgAction
  .schema(UpdateReviewSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const review = await prisma.review.update({
      where: {
        id: input.reviewId,
        organizationId: ctx.org.id,
      },
      data: {
        ...(input.authorName && { authorName: input.authorName }),
        ...(input.authorRole && { authorRole: input.authorRole }),
        ...(input.text && { text: input.text }),
        status: input.status,
      },
    });

    revalidatePath(`/orgs/${ctx.org.slug}/reviews/${input.reviewId}`);

    return review;
  });
