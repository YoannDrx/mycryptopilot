import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Check, Lock } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  "Beginner to advanced trading courses",
  "Technical analysis video tutorials",
  "Risk management strategies and frameworks",
  "Market psychology and trading discipline",
  "Certifications from verified traders",
];

type SchoolPaywallProps = {
  currentPlan: string;
};

export function SchoolPaywall({ currentPlan }: SchoolPaywallProps) {
  const planLabel = `${currentPlan.slice(0, 1).toUpperCase()}${currentPlan.slice(1)}`;
  return (
    <div className="container max-w-3xl py-16">
      <Card className="border-dashed">
        <CardHeader className="space-y-4 text-center">
          <div className="bg-muted mx-auto flex size-16 items-center justify-center rounded-full">
            <Lock className="size-7" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Upgrade to unlock Crypto School
            </CardTitle>
            <p className="text-muted-foreground">
              You are currently on the {planLabel} plan. Upgrade to Pro or Ultra
              to access our comprehensive crypto trading education platform.
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
                <Check className="text-primary size-4" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex flex-col items-center gap-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <GraduationCap className="size-4" />
              <span>Learn from verified crypto traders</span>
            </div>
            <Button asChild size="lg">
              <Link href="/pricing?upgrade=pro&feature=crypto-school">
                View pricing & upgrade
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
