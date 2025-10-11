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
import { getRequiredUser } from "@/lib/auth/cached-get-user";
import { getCurrentOrgCache } from "@/lib/org/cached-get-current-org";
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";

type CheckoutPageProps = {
  params: {
    orgSlug: string;
    plan: string;
  };
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const user = await getRequiredUser();
  const org = await getCurrentOrgCache();

  // Validate plan parameter
  const planName = params.plan.toUpperCase();
  if (planName !== "PRO" && planName !== "ULTRA") {
    redirect(`/orgs/${org.slug}/pricing`);
  }

  const plan = MYCRYPTOPILOT_PLANS[planName as "PRO" | "ULTRA"];

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-4 text-3xl font-bold">Checkout - {plan.name} Plan</h1>
      <p className="mb-8 text-muted-foreground">
        Complete your payment to unlock {plan.limits.signalsPerDay} signals per day
      </p>

      {/* TODO: Add CheckoutForm component */}
      <div className="rounded-lg border p-8">
        <p className="text-center text-muted-foreground">
          🚧 Checkout UI coming soon...
        </p>
        <p className="mt-4 text-center text-sm">
          Issue #34: UI Checkout Page implementation in progress
        </p>
      </div>
    </div>
  );
}
