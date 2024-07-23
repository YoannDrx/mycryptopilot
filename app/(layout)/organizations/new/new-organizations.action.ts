"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { NewOrganizationSchema } from "./new-organizations.schema";

export const createOrganizationAction = authAction
  .schema(NewOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const organization = await prisma.organization.create({
      data: {
        name: parsedInput.name,
        id: parsedInput.id,
        email: parsedInput.email,
        members: {
          create: {
            userId: ctx.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return organization;
  });
