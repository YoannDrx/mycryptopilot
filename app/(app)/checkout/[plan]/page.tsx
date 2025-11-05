/**
 * Checkout Page - Crypto Payment
 * Big Bang (Issue #77 Phase 5) - User-centric checkout
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
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { env } from "@/lib/env";

type CheckoutPageProps = {
  params: Promise<{
    plan: string;
  }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  await getRequiredUser();
  const { plan } = await params;

  // Validate plan parameter
  const planName = plan.toLowerCase();
  if (planName !== "pro" && planName !== "ultra" && planName !== "test") {
    redirect("/pricing");
  }

  return (
    <CheckoutForm
      plan={planName as "pro" | "ultra" | "test"}
      isTestnet={env.CRYPTO_NETWORK === "testnet"}
    />
  );
}
