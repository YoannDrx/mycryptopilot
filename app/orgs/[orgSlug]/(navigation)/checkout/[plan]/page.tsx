/**
 * Checkout Page - Crypto Payment
 *
 * User flow:
 * 1. User arrives from pricing page (e.g., /checkout/pro)
 * 2. Generate unique crypto addresses (Base USDC + Tron USDT)
 * 3. Display addresses with QR codes
 * 4. Countdown timer (15 min expiration)
 * 5. Poll payment status every 10s
 * 6. On payment confirmed → Activate subscription → Redirect to dashboard
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/34
 */

import { redirect } from "next/navigation";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getRequiredCurrentOrg } from "@/lib/organizations/get-org";
import { CheckoutForm } from "@/components/checkout/checkout-form";

type CheckoutPageProps = {
  params: {
    orgSlug: string;
    plan: string;
  };
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  await getRequiredUser();
  const org = await getRequiredCurrentOrg();

  // Validate plan parameter
  const planName = params.plan.toLowerCase();
  if (planName !== "pro" && planName !== "ultra") {
    redirect(`/orgs/${org.slug}/pricing`);
  }

  return <CheckoutForm plan={planName as "pro" | "ultra"} orgSlug={org.slug} />;
}
