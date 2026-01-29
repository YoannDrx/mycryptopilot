"use client";

import { Button } from "@/components/ui/button";
import { HyperBorder } from "@/components/design-system";
import { Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type PlanKey = "free" | "pro" | "ultra";

const PLANS: {
  key: PlanKey;
  price: number;
  highlighted: boolean;
}[] = [
  { key: "free", price: 0, highlighted: false },
  { key: "pro", price: 49, highlighted: true },
  { key: "ultra", price: 99, highlighted: false },
];

export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="bg-[var(--bg-onyx)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <HyperBorder
              key={plan.key}
              variant={plan.highlighted ? "glow-emerald" : "default"}
              className={`relative p-6 ${
                plan.highlighted ? "border-[var(--accent-emerald)]/30" : ""
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[var(--accent-emerald)] px-4 py-1 text-xs font-semibold text-[var(--bg-obsidian)]">
                    {t("popular")}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
                {t(`${plan.key}.name`)}
              </h3>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                {t(`${plan.key}.description`)}
              </p>

              {/* Price */}
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  ${plan.price}
                </span>
                <span className="text-[var(--text-muted)]">{t("monthly")}</span>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {(t.raw(`${plan.key}.features`) as string[]).map(
                  (feature: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                    >
                      <Check className="mt-0.5 size-4 flex-shrink-0 text-[var(--accent-emerald)]" />
                      <span>{feature}</span>
                    </li>
                  ),
                )}
              </ul>

              {/* CTA */}
              <Button
                asChild
                variant={plan.highlighted ? "emerald" : "glass"}
                className="w-full"
              >
                <Link href={`/checkout/${plan.key}`}>{t("cta")}</Link>
              </Button>
            </HyperBorder>
          ))}
        </div>

        {/* Payment note */}
        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Paiement en USDC (Base) ou USDT (Tron) • Pas de carte bancaire requise
        </p>
      </div>
    </section>
  );
}
