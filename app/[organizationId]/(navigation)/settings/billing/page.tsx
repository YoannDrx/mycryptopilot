import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { formatDate } from "@/lib/format/date";
import { getRequiredCurrentOrganizationCache } from "@/lib/react/cache";
import { stripe } from "@/lib/stripe";
import type { PageParams } from "@/types/next";

export default async function RoutePage(props: PageParams<{}>) {
  const { organization } = await getRequiredCurrentOrganizationCache(["ADMIN"]);

  if (!organization.stripeCustomerId) {
    throw new Error("Organization has no Stripe customer");
  }

  if (organization.plan.name !== "FREE") {
    return <Card>Upgrade</Card>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PremiumCard />
    </div>
  );
}

const PremiumCard = async () => {
  const { organization } = await getRequiredCurrentOrganizationCache(["ADMIN"]);

  if (!organization.stripeCustomerId) {
    throw new Error("Organization has no Stripe customer");
  }

  const stripeCustomer = await stripe.customers.retrieve(
    organization.stripeCustomerId,
  );
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomer.id,
  });
  const firstSubscription = subscriptions.data[0];
  const nextRenewDate = firstSubscription.current_period_end;
  const price = firstSubscription.items.data[0].price;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Plan</CardDescription>
        <CardTitle>{organization.plan.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Typography variant="muted">Price</Typography>
        <Typography variant="large">
          ${(price.unit_amount ?? 0) / 100}
        </Typography>
        <Typography variant="muted">Renew date</Typography>
        <Typography variant="large">
          {formatDate(new Date(nextRenewDate * 1000))}
        </Typography>
      </CardContent>
    </Card>
  );
};
