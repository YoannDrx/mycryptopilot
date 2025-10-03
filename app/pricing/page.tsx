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
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";
import type { Metadata } from "next";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing - MyCryptoPilot",
  description:
    "Choose your plan and start receiving crypto trading signals. Pay with USDC (Base) or USDT (Tron).",
};

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Pay with crypto. No credit card required. Cancel anytime.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Badge variant="secondary">USDC (Base)</Badge>
            <Badge variant="secondary">USDT (Tron)</Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {MYCRYPTOPILOT_PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.isPopular
                  ? "border-primary relative shadow-lg"
                  : "relative"
              }
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-3 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between text-2xl">
                  <span className="capitalize">{plan.name}</span>
                  {plan.priceUSD > 0 && (
                    <span className="text-3xl font-bold">
                      ${plan.priceUSD}
                      <span className="text-muted-foreground text-sm font-normal">
                        /mo
                      </span>
                    </span>
                  )}
                  {plan.priceUSD === 0 && (
                    <span className="text-3xl font-bold">Free</span>
                  )}
                </CardTitle>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Icon className="text-primary size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{feature.label}</p>
                          <p className="text-muted-foreground text-sm">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Limits Summary */}
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="text-primary size-4" />
                    <span>
                      {plan.limits.signalsPerDay === 999
                        ? "Unlimited"
                        : plan.limits.signalsPerDay}{" "}
                      signals per day
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="text-primary size-4" />
                    <span>
                      {plan.limits.tradersFollow === 999
                        ? "Unlimited"
                        : plan.limits.tradersFollow}{" "}
                      traders to follow
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="text-primary size-4" />
                    <span>
                      {plan.limits.screenerRefreshSec < 60
                        ? `${plan.limits.screenerRefreshSec}sec`
                        : `${plan.limits.screenerRefreshSec / 60}min`}{" "}
                      screener refresh
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.isPopular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.priceUSD === 0 ? "Get Started" : "Subscribe Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-16 text-center">
          <h3 className="mb-4 text-xl font-semibold">Secure Crypto Payments</h3>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Pay with USDC on Base network or USDT on Tron network. Your
            subscription activates automatically once your payment is confirmed
            on-chain.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Badge variant="outline" className="px-4 py-2">
              <span className="mr-2">⚡</span>
              Base (USDC) - 1 confirmation
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <span className="mr-2">🔷</span>
              Tron (USDT) - 2 confirmations
            </Badge>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h3 className="mb-8 text-center text-2xl font-semibold">
            Frequently Asked Questions
          </h3>
          <div className="mx-auto max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How does crypto payment work?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  After selecting a plan, you'll receive a unique crypto address
                  to send USDC (Base) or USDT (Tron). Once your payment is
                  confirmed on-chain, your subscription activates automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I pay less than the monthly price?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Yes! We support pro-rata payments. If you pay half the monthly
                  price, you'll get 15 days of access. Pay any amount and we'll
                  calculate your subscription duration automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How do I cancel my subscription?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Simply stop sending payments. Your subscription will expire at
                  the end of your paid period. No need to cancel anything - you
                  stay in control.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What if I send the wrong amount?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  No problem! Our system will detect the amount you sent and
                  grant you the appropriate plan or pro-rata duration. You can
                  always top up later to extend your subscription.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
