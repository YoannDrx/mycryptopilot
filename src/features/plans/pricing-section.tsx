"use client";

import { Badge } from "@/components/ui/badge";
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";
import Link from "next/link";
import { LandingPricingCard } from "./landing-pricing-card";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="from-background to-muted/20 w-full bg-gradient-to-b py-12 md:py-24 lg:py-32"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Pricing built for risk-first traders
            </h2>
            <p className="text-muted-foreground max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Start free with verified signal previews. Upgrade whenever you
              need more traders, faster syncs, or automation—paid with crypto on
              your schedule.
            </p>
          </div>

          {/* Crypto Payment Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-sm">
              💎 USDC (Base)
            </Badge>
            <Badge variant="secondary" className="text-sm">
              💎 USDT (Tron)
            </Badge>
            <Badge variant="outline" className="text-sm">
              ⚡ Pro-rata billing
            </Badge>
          </div>

          <p className="text-muted-foreground/80 mt-2 text-sm">
            Pay any amount—your subscription duration is calculated
            automatically.
          </p>
        </div>

        <div
          className="mt-16 grid gap-8 lg:gap-12"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {MYCRYPTOPILOT_PLANS.filter((p) => p.name !== "test").map((plan) => (
            <LandingPricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            <span className="text-foreground font-semibold">
              All plans include the risk console (2% rule)
            </span>{" "}
            with varying calculation limits. Upgrade to Pro or Ultra for higher
            limits, trading journal, and automation tools.
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
