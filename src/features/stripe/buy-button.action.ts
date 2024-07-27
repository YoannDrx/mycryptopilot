"use server";

import { ActionError, action } from "@/lib/actions/safe-actions";
import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const BuyButtonSchema = z.object({
  priceId: z.string(),
  organizationId: z.string(),
});

export const buyButtonAction = action
  .schema(BuyButtonSchema)
  .action(async ({ parsedInput: { priceId, organizationId } }) => {
    const user = await auth();

    if (!user) {
      throw new ActionError("You must be authenticated to buy a plan");
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    const stripeCustomerId = organization?.stripeCustomerId ?? undefined;

    if (!stripeCustomerId) {
      throw new ActionError(
        "You must be part of an organization to buy a plan",
      );
    }

    const price = await stripe.prices.retrieve(priceId);

    const priceType = price.type;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: priceType === "one_time" ? "payment" : "subscription",
      payment_method_types: ["card", "link"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${getServerUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getServerUrl()}/payment/cancel`,
    });

    if (!session.url) {
      throw new ActionError("Something went wrong while creating the session.");
    }

    return { url: session.url };
  });
