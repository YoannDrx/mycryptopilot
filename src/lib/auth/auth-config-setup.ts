import type { User } from "next-auth";
import { z } from "zod";
import { env } from "../env";
import { resend } from "../mail/resend";
import { prisma } from "../prisma";
import { stripe } from "../stripe";

export const setupStripeCustomer = async (user: User) => {
  if (!user.email) {
    return;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
  });

  return customer.id;
};

export const setupResendCustomer = async (user: User) => {
  if (!user.email) {
    return;
  }

  if (!env.RESEND_AUDIENCE_ID) {
    return;
  }

  const contact = await resend.contacts.create({
    audienceId: env.RESEND_AUDIENCE_ID,
    email: user.email,
    firstName: user.name ?? "",
    unsubscribed: false,
  });

  if (!contact.data) return;

  return contact.data.id;
};

const TokenSchema = z.object({
  organizationId: z.string(),
});

export const setupOrganizationIfPendingInvitation = async (user: User) => {
  if (!user.email || !user.id) {
    return;
  }

  const tokens = await prisma.verificationToken.findMany({
    where: {
      identifier: user.email,
    },
  });

  if (tokens.length === 0) {
    return;
  }

  for await (const token of tokens) {
    const tokenData = TokenSchema.parse(token.data);

    if (tokenData.organizationId) {
      await prisma.organizationMembership.create({
        data: {
          organizationId: tokenData.organizationId,
          userId: user.id,
          role: "MEMBER",
        },
      });
      await prisma.verificationToken.delete({
        where: {
          token: token.token,
        },
      });
    }
  }
};
