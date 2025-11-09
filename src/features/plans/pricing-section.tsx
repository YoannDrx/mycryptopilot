"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";
import Link from "next/link";
import { LandingPricingCard } from "./landing-pricing-card";
import { PricingComparisonTable } from "./pricing-comparison-table";

export function Pricing() {
  const { data: session } = useSession();
  return (
    <section
      id="pricing"
      className="from-background to-muted/20 w-full bg-gradient-to-b py-12 md:py-24 lg:py-32"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Pay with crypto. No credit card required. Cancel anytime. Pro-rata
              billing means you only pay for what you use.
            </p>
          </div>

          {/* Crypto Payment Badges */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <Badge variant="secondary">USDC (Base)</Badge>
            <Badge variant="secondary">USDT (Tron)</Badge>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {MYCRYPTOPILOT_PLANS.filter((p) => p.name !== "test").map((plan) => (
            <LandingPricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* Test Payment CTA - Only for logged-in users */}
        {session?.user && (
          <Card className="bg-muted/30 mx-auto mt-12 max-w-3xl border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-6 py-8 text-center sm:flex-row sm:text-left">
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold">
                  Test the Payment System First
                </h3>
                <p className="text-muted-foreground text-sm">
                  Not sure about crypto payments? Try our test payment for just
                  $1 to verify everything works perfectly before subscribing to
                  a full plan.
                </p>
              </div>
              <Button variant="outline" size="lg" className="shrink-0" asChild>
                <Link href="/checkout/test">Send $1 Test Payment</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        <PricingComparisonTable />

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Try the risk console demo for free on our landing page. Pro and
            Ultra plans unlock unlimited access with calculation history, custom
            presets, and live capital integration.
          </p>
          <p className="text-muted-foreground mt-2">
            Need a custom plan for your trading team?{" "}
            <Link
              href="/contact"
              className="text-primary font-medium hover:underline"
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
