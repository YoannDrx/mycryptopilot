import type { Metadata } from "next";

import { getPlanLimits } from "@/lib/crypto/get-plan-limits";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getUserRiskPresets } from "@/features/risk-console/risk-console-queries";

import { RiskConsolePageContent } from "./_components/risk-console-page-content";
import { RiskConsolePaywall } from "./_components/risk-console-paywall";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Risk Console",
  description:
    "Access position sizing and risk management tools tailored for MyCryptoPilot Pro and Ultra plans.",
};

export default async function RiskConsolePage() {
  const user = await getRequiredUser();

  // MyCryptoPilot uses User.planName (not org.subscription)
  const planName = (user.planName ?? "free") as MyCryptoPilotPlanName;
  const planLimits = getPlanLimits(planName);

  if (!planLimits.riskConsole) {
    return <RiskConsolePaywall currentPlan={planName} />;
  }

  // Load user presets
  const userPresets = await getUserRiskPresets(user.id);

  return (
    <RiskConsolePageContent planName={planName} userPresets={userPresets} />
  );
}
