import type { Metadata } from "next";

import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getUserRiskPresets } from "@/features/risk-console/risk-console-queries";

import { RiskConsolePageContent } from "./_components/risk-console-page-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Risk Console",
  description:
    "Simulate position sizing and risk without executing a financial transaction.",
};

export default async function RiskConsolePage() {
  const user = await getRequiredUser();

  // MyCryptoPilot uses User.planName (not org.subscription)
  const planName = (user.planName ?? "free") as MyCryptoPilotPlanName;
  // Load user presets
  const userPresets = await getUserRiskPresets(user.id);

  return (
    <RiskConsolePageContent planName={planName} userPresets={userPresets} />
  );
}
