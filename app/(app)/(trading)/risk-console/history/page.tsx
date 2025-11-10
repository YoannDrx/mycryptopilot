import { getRequiredUser } from "@/lib/auth/auth-user";
import { getUserRiskCalculations } from "@/features/risk-console/risk-console-queries";
import { RiskCalculationHistory } from "./_components/risk-calculation-history";
import type { Metadata } from "next";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { getPlanLimits } from "@/lib/crypto/get-plan-limits";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { RiskConsolePaywall } from "../_components/risk-console-paywall";

export const metadata: Metadata = {
  title: "Risk Console History - MyCryptoPilot",
  description: "View your past risk calculations and reload them",
};

export default async function RiskConsoleHistoryPage() {
  const user = await getRequiredUser();

  // Check plan limits (same as Risk Console main page)
  const planName = (user.planName ?? "free") as MyCryptoPilotPlanName;
  const planLimits = getPlanLimits(planName);

  if (!planLimits.riskConsole) {
    return <RiskConsolePaywall currentPlan={planName} />;
  }

  const calculations = await getUserRiskCalculations(user.id, 50);

  return (
    <>
      <LayoutHeader>
        <LayoutTitle>Risk Console History</LayoutTitle>
        <LayoutDescription>
          View and reload your past risk calculations
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent>
        <RiskCalculationHistory calculations={calculations} />
      </LayoutContent>
    </>
  );
}
