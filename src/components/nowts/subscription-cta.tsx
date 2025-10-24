"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, Crown, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export type SubscriptionCTAProps = {
  variant?: "compact" | "full";
  planToPromote?: "pro" | "ultra";
  className?: string;
};

export const SubscriptionCTA = ({
  variant = "full",
  planToPromote = "pro",
  className,
}: SubscriptionCTAProps) => {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const isPro = planToPromote === "pro";

  const planData = {
    pro: {
      name: "Pro",
      price: 49,
      icon: Zap,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      benefits: [
        "50 signals per day",
        "Follow up to 5 traders",
        "Risk Console & Trading Journal",
        "1-second screener refresh",
      ],
    },
    ultra: {
      name: "Ultra",
      price: 99,
      icon: Crown,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      benefits: [
        "Unlimited signals per day",
        "Follow unlimited traders",
        "All Pro features",
        "Custom Alerts & Advanced Filters",
      ],
    },
  };

  const plan = planData[planToPromote];
  const Icon = plan.icon;

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "border-2 transition-all hover:shadow-md",
          isPro ? "border-amber-200" : "border-purple-200",
          className,
        )}
      >
        <CardContent className={cn("bg-gradient-to-r p-4", plan.bgGradient)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full bg-gradient-to-br text-white",
                  plan.gradient,
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Upgrade to {plan.name}
                </p>
                <p className="text-sm text-gray-600">
                  Unlock unlimited signals & advanced features
                </p>
              </div>
            </div>
            <Link href={`/orgs/${orgSlug}/pricing`}>
              <Button size="sm" variant="default">
                View Plans <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:shadow-lg",
        isPro ? "border-amber-200" : "border-purple-200",
        className,
      )}
    >
      <CardHeader className={cn("bg-gradient-to-br pb-6", plan.bgGradient)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full bg-gradient-to-br text-white",
                plan.gradient,
              )}
            >
              <Icon className="size-6" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                {plan.name} Plan
                <Sparkles className="size-5 text-yellow-500" />
              </CardTitle>
              <CardDescription className="mt-1">
                ${plan.price}/month - Unlock your trading potential
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Benefits List */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            What you'll get:
          </p>
          <ul className="space-y-2">
            {plan.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-600">✓</span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col gap-2 pt-2">
          <Link href={`/orgs/${orgSlug}/pricing`} className="w-full">
            <Button
              className={cn(
                "w-full bg-gradient-to-r text-white",
                plan.gradient,
              )}
              size="lg"
            >
              Upgrade to {plan.name} <ArrowRight className="ml-2 size-5" />
            </Button>
          </Link>
          <p className="text-muted-foreground text-center text-xs">
            Pay with crypto (USDC or USDT)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
