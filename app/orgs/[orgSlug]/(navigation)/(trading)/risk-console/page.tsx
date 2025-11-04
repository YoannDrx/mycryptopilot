import type { Metadata } from "next";

import { getPlanLimits } from "@/lib/crypto/get-plan-limits";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";

import { RiskConsolePageContent } from "./_components/risk-console-page-content";
import { RiskConsolePaywall } from "./_components/risk-console-paywall";

export const metadata: Metadata = {
  title: "Risk Console",
  description:
    "Access position sizing and risk management tools tailored for MyCryptoPilot Pro and Ultra plans.",
};

export default async function RiskConsolePage() {
  const org = await getRequiredCurrentOrgCache();
  const planName = (org.subscription?.plan ?? "free") as MyCryptoPilotPlanName;
  const planLimits = getPlanLimits(planName);

  if (!planLimits.riskConsole) {
    return <RiskConsolePaywall orgSlug={org.slug} currentPlan={planName} />;
  }

  return <RiskConsolePageContent planName={planName} />;
}
