import { getRequiredUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { FileUp } from "lucide-react";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { TaxPaywall } from "../../_components/tax-paywall";

/**
 * Import Transactions Page
 *
 * Big Bang (Issue #77 Phase 11) - Placeholder for multi-sidebar architecture
 *
 * Upload and import transactions from exchanges
 * TODO: Implement CSV import functionality
 *
 * Restriction: ULTRA plan only
 */
export default async function ImportTransactionsPage() {
  const user = await getRequiredUser();

  // Check plan limits - Tax Declaration requires ULTRA plan
  const planName = (user.planName ?? "free") as MyCryptoPilotPlanName;

  // Tax features require ULTRA plan (not available in PRO)
  if (planName !== "ultra") {
    return <TaxPaywall currentPlan={planName} />;
  }

  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <FileUp className="size-5" />
        </div>
        <div>
          <LayoutTitle>Import Transactions</LayoutTitle>
          <LayoutDescription>
            Upload your exchange transactions for tax reporting
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Tax declaration feature is under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Typography variant="muted">
              We're building comprehensive tax tools that will support:
            </Typography>
            <ul className="text-muted-foreground mt-3 ml-6 list-disc space-y-1">
              <li>
                CSV import from major exchanges (Binance, Bybit, Coinbase, etc.)
              </li>
              <li>Automatic transaction categorization</li>
              <li>Cost basis calculation (FIFO, LIFO, HIFO)</li>
              <li>Capital gains/losses reporting</li>
              <li>Multi-jurisdiction compliance</li>
            </ul>
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
