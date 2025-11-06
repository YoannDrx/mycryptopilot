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

/**
 * Import Transactions Page
 *
 * Big Bang (Issue #77 Phase 11) - Placeholder for multi-sidebar architecture
 *
 * Upload and import transactions from exchanges
 * TODO: Implement CSV import functionality
 */
export default async function ImportTransactionsPage() {
  await getRequiredUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <FileUp className="size-8" />
        <div>
          <Typography variant="h1">Import Transactions</Typography>
          <Typography variant="muted">
            Upload your exchange transactions for tax reporting
          </Typography>
        </div>
      </div>

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
    </div>
  );
}
