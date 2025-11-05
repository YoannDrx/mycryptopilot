import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Check, Lock } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  "Auto-detect LONG vs SHORT setups",
  "Validate your risk / reward before publishing",
  "Get position sizing based on your capital",
];

type RiskConsolePaywallProps = {
  orgSlug: string;
  currentPlan: string;
};

export function RiskConsolePaywall({
  orgSlug,
  currentPlan,
}: RiskConsolePaywallProps) {
  const planLabel = `${currentPlan.slice(0, 1).toUpperCase()}${currentPlan.slice(1)}`;
  return (
    <div className="container max-w-3xl py-16">
      <Card className="border-dashed">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <Lock className="size-7" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Upgrade to unlock the Risk Console</CardTitle>
            <p className="text-muted-foreground">
              You are currently on the {planLabel} plan. Upgrade to Pro or Ultra to access advanced risk management tools.
            </p>
          </div>
          <Badge variant="secondary" className="mx-auto w-fit">
            Included in Pro & Ultra plans
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <ul className="space-y-3 text-left">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="size-4" />
              <span>Preview available on landing page</span>
            </div>
            <Button asChild size="lg">
              <Link href={`/orgs/${orgSlug}/pricing?upgrade=risk-console`}>
                View pricing & upgrade
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
