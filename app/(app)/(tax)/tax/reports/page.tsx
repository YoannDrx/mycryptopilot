import { getRequiredUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import { FileText } from "lucide-react";

/**
 * Tax Reports Page
 *
 * Big Bang (Issue #77 Phase 11) - Placeholder for multi-sidebar architecture
 *
 * Generate and download tax reports
 * TODO: Implement tax report generation
 */
export default async function TaxReportsPage() {
  await getRequiredUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <FileText className="size-8" />
        <div>
          <Typography variant="h1">Tax Reports</Typography>
          <Typography variant="muted">
            Generate comprehensive tax reports for your jurisdiction
          </Typography>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No reports available yet</CardTitle>
          <CardDescription>
            Import your transactions first to generate tax reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Typography variant="muted">
            Available report formats will include:
          </Typography>
          <ul className="text-muted-foreground mt-3 ml-6 list-disc space-y-1">
            <li>IRS Form 8949 (USA)</li>
            <li>HMRC Crypto Assets Report (UK)</li>
            <li>Annual tax summary (all jurisdictions)</li>
            <li>Transaction history CSV export</li>
            <li>PDF reports for accountants</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
