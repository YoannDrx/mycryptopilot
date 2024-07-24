"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NewOrganizationSchema } from "./new-organizations.schema";

export const createOrganizationAction = authAction
  .schema(NewOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const customer = await stripe.customers.create({
      email: parsedInput.email,
      name: parsedInput.name,
    });

    const organization = await prisma.organization.create({
      data: {
        name: parsedInput.name,
        id: parsedInput.id,
        email: parsedInput.email,
        stripeCustomerId: customer.id,
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
