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

export const metadata: Metadata = {
  title: "Risk Console History - MyCryptoPilot",
  description: "View your past risk calculations and reload them",
};

export default async function RiskConsoleHistoryPage() {
  const user = await getRequiredUser();
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
