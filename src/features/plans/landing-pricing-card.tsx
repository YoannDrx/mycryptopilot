"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient, useSession } from "@/lib/auth-client";
import type { MyCryptoPilotPlan } from "@/lib/crypto/mycryptopilot-plans";
import { Check } from "lucide-react";
import Link from "next/link";

type LandingPricingCardProps = {
  plan: MyCryptoPilotPlan;
};

export function LandingPricingCard({ plan }: LandingPricingCardProps) {
  const { data: session } = useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Determine the subscribe link based on auth status
  const getSubscribeLink = () => {
    if (!session?.user) {
      return "/auth/signup";
    }

    if (activeOrg) {
      return `/orgs/${activeOrg.slug}/pricing`;
    }

    return "/auth/signup";
  };

  const subscribeLink = getSubscribeLink();
  const isFree = plan.priceUSD === 0;

  return (
    <Card
      className={`relative ${plan.isPopular ? "border-primary shadow-lg" : ""}`}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
        <CardDescription className="min-h-[48px]">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.priceUSD}</span>
          <span className="text-muted-foreground text-lg">/month</span>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {plan.features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <li key={idx} className="flex items-start gap-3">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-medium">{feature.label}</p>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Limits Summary */}
        <div className="border-border mt-6 space-y-2 border-t pt-4">
          <div className="flex items-center gap-2 text-sm">
            <Check className="text-primary size-4 shrink-0" />
            <span>
              {plan.limits.activeSignalsLimit === 999
                ? "Unlimited"
                : plan.limits.activeSignalsLimit}{" "}
              active signals
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="text-primary size-4 shrink-0" />
            <span>
              {plan.limits.tradersFollow === 999
                ? "Unlimited"
                : plan.limits.tradersFollow}{" "}
              {plan.limits.tradersFollow === 1 ? "trader" : "traders"}
            </span>
          </div>
          {plan.limits.riskConsole && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="text-primary size-4 shrink-0" />
              <span>Risk console (2% rule)</span>
            </div>
          )}
          {plan.limits.journaling && (
            <div className="flex items-center gap-2 text-sm">
              <Check className="text-primary size-4 shrink-0" />
              <span>Trading journal</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          size="lg"
          className="w-full"
          variant={plan.isPopular ? "default" : "outline"}
          asChild
        >
          <Link href={subscribeLink}>
            {isFree ? "Get Started Free" : "Subscribe Now"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
