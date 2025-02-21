"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { defaultPageConfig } from "../_schema/page-config.schema";

const Schema = z.object({
  name: z.string().min(3).max(50),
});

export const createPageAction = orgAction
  .schema(Schema)
  .action(async ({ parsedInput: input, ctx }) => {
    const page = await prisma.reviewPage.create({
      data: {
        name: input.name,
        organizationId: ctx.org.id,
        config: defaultPageConfig,
      },
    });

    return page;
  });
