"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PageConfigSchema } from "../_schema/page-config.schema";

const Schema = z.object({
  pageId: z.string(),
  config: PageConfigSchema,
});

export const updatePageAction = orgAction
  .schema(Schema)
  .action(async ({ parsedInput: input, ctx }) => {
    const page = await prisma.reviewPage.update({
      where: {
        id: input.pageId,
        organizationId: ctx.org.id,
      },
      data: {
        config: input.config,
      },
    });

    return page;
  });
