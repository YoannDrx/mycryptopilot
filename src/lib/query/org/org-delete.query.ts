import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const deleteOrganizationQuery = async (id: string) => {
  const org = await prisma.organization.findUnique({
    where: {
      id: id,
    },
  });

  if (!org?.stripeCustomerId) return;

  const subscriptions = await stripe.subscriptions.list({
    customer: org.stripeCustomerId,
  });

  for (const subscription of subscriptions.data) {
    await stripe.subscriptions.cancel(subscription.id);
  }

  await prisma.organization.delete({
    where: {
      id: id,
    },
  });
};
