"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";

type ComparisonRow = {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  ultra: string | boolean;
};

const COMPARISON_FEATURES: ComparisonRow[] = [
  {
    feature: "Active signals tracked",
    free: "3 signals",
    pro: "15 signals",
    ultra: "Unlimited",
  },
  {
    feature: "Traders to follow",
    free: "1 trader",
    pro: "5 traders",
    ultra: "Unlimited",
  },
  {
    feature: "Screener refresh rate",
    free: "5 minutes",
    pro: "1 minute",
    ultra: "5 seconds",
  },
  {
    feature: "Risk console (2% rule)",
    free: false,
    pro: true,
    ultra: true,
  },
  {
    feature: "Trading journal",
    free: false,
    pro: true,
    ultra: true,
  },
  {
    feature: "Custom alerts",
    free: false,
    pro: false,
    ultra: true,
  },
  {
    feature: "Advanced filters",
    free: false,
    pro: false,
    ultra: true,
  },
  {
    feature: "Crypto School access",
    free: false,
    pro: true,
    ultra: true,
  },
  {
    feature: "Tax Help tools",
    free: false,
    pro: false,
    ultra: true,
  },
];

const CellValue = ({ value }: { value: string | boolean }) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="text-primary mx-auto size-5" />
    ) : (
      <X className="text-muted-foreground mx-auto size-5" />
    );
  }
  return <span className="text-sm">{value}</span>;
};

export function PricingComparisonTable() {
  const freePlan = MYCRYPTOPILOT_PLANS.find((p) => p.name === "free");
  const proPlan = MYCRYPTOPILOT_PLANS.find((p) => p.name === "pro");
  const ultraPlan = MYCRYPTOPILOT_PLANS.find((p) => p.name === "ultra");

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          Compare All Plans
        </CardTitle>
        <p className="text-muted-foreground text-center text-sm">
          Choose the plan that best fits your trading needs
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Feature</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold">Free</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      ${freePlan?.priceUSD}/mo
                    </span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold">Pro</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      ${proPlan?.priceUSD}/mo
                    </span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold">Ultra</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      ${ultraPlan?.priceUSD}/mo
                    </span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARISON_FEATURES.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell className="text-center">
                    <CellValue value={row.free} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellValue value={row.pro} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellValue value={row.ultra} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
