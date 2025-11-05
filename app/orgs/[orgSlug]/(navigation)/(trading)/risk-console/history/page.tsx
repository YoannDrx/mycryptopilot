import { getRequiredUser } from "@/lib/auth/auth-user";
import { getUserRiskCalculations } from "@/features/risk-console/risk-console-queries";
import { RiskCalculationHistory } from "./_components/risk-calculation-history";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Console History - MyCryptoPilot",
  description: "View your past risk calculations and reload them",
};

export default async function RiskConsoleHistoryPage() {
  const user = await getRequiredUser();
  const calculations = await getUserRiskCalculations(user.id, 50);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Risk Console History</h1>
        <p className="text-muted-foreground mt-2">
          View and reload your past risk calculations
        </p>
      </div>
      <RiskCalculationHistory calculations={calculations} />
    </div>
  );
}
