"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { createOrganizationQuery } from "@/lib/query/org/org-create.query";
import { NewOrgsSchema } from "./new-organizations.schema";

export const createOrganizationAction = authAction
  .schema(NewOrgsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const org = await createOrganizationQuery({
      name: parsedInput.name,
      id: parsedInput.id,
      email: parsedInput.email,
      members: {
        create: {
          userId: ctx.user.id,
          role: "OWNER",
        },
      },
    });

    return org;
  });
