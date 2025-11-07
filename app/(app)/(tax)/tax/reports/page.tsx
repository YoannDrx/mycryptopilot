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
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";

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
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <FileText className="size-5" />
        </div>
        <div>
          <LayoutTitle>Tax Reports</LayoutTitle>
          <LayoutDescription>
            Generate comprehensive tax reports for your jurisdiction
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
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
      </LayoutContent>
    </>
  );
}
