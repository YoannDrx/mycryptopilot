"use client";

import { Button } from "@/components/ui/button";
import {
  GrainOverlay,
  HyperBorder,
  MeshGradient,
} from "@/components/design-system";
import { Logo } from "@/components/brand";
import { ArrowRight, Play, Shield, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--bg-obsidian)]">
      {/* Background effects */}
      <MeshGradient variant="default" />
      <GrainOverlay opacity={0.03} />

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 170, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 170, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm backdrop-blur-sm">
              <span className="size-2 animate-pulse rounded-full bg-[var(--accent-emerald)]" />
              <span className="text-[var(--text-secondary)]">
                Démo / Testnet • Risk-first
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              {t("headline").split(" ").slice(0, -2).join(" ")}{" "}
              <span className="bg-gradient-to-r from-[var(--accent-emerald)] to-[#00d4ff] bg-clip-text text-transparent">
                {t("headline").split(" ").slice(-2).join(" ")}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-8 max-w-xl text-lg text-[var(--text-secondary)] lg:mx-0">
              {t("subheadline")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Button
                asChild
                variant="emerald"
                size="lg"
                className="h-12 px-8 text-base"
              >
                <Link href="/auth/signup">
                  {t("cta.primary")}
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="h-12 px-8 text-base"
              >
                <Link href="#how-it-works">
                  <Play className="mr-2 size-5" />
                  {t("cta.secondary")}
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: "0", label: "fonds confiés", icon: Shield },
                { value: "Read-only", label: "clés exchange", icon: Users },
                {
                  value: "Exemple",
                  label: "données affichées",
                  icon: TrendingUp,
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    <stat.icon className="size-5 text-[var(--accent-emerald)]" />
                    <span className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                      {stat.value}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Interactive Risk Console Preview */}
          <div className="relative">
            <HyperBorder
              variant="glow-emerald"
              className="relative overflow-hidden p-1"
            >
              {/* Console Header */}
              <div className="flex items-center gap-2 rounded-t-xl border-b border-[var(--glass-border)] bg-[var(--bg-onyx)] px-4 py-3">
                <div className="size-3 rounded-full bg-[var(--accent-crimson)]" />
                <div className="size-3 rounded-full bg-[#f59e0b]" />
                <div className="size-3 rounded-full bg-[var(--accent-emerald)]" />
                <span className="ml-3 text-xs text-[var(--text-muted)]">
                  Risk Console • EXEMPLE TESTNET
                </span>
              </div>

              {/* Console Content */}
              <div className="rounded-b-xl bg-[var(--bg-onyx)] p-6">
                {/* Trade Info */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Logo variant="icon" size="sm" />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        BTC/USDT
                      </div>
                      <div className="text-xs text-[var(--accent-emerald)]">
                        LONG • x10
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      $96,420
                    </div>
                    <div className="text-xs text-[var(--accent-emerald)]">
                      +2.4%
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[var(--bg-graphite)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      Position Size
                    </div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      0.12 BTC
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-graphite)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">Risk</div>
                    <div className="text-lg font-semibold text-[var(--accent-emerald)]">
                      2% ($240)
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-graphite)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      Stop Loss
                    </div>
                    <div className="text-lg font-semibold text-[var(--accent-crimson)]">
                      $94,420
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-graphite)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      Take Profit
                    </div>
                    <div className="text-lg font-semibold text-[var(--accent-emerald)]">
                      $102,000
                    </div>
                  </div>
                </div>

                {/* R:R Bar */}
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">
                      Risk/Reward
                    </span>
                    <span className="font-semibold text-[var(--accent-emerald)]">
                      1:2.8
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-graphite)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-emerald)] to-[#00d4ff]"
                      style={{ width: "70%" }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <Button variant="emerald" className="w-full">
                  Simuler le risque
                </Button>
              </div>
            </HyperBorder>

            {/* Floating elements */}
            <div className="absolute -right-4 -bottom-4 -z-10 h-32 w-32 rounded-full bg-[var(--accent-emerald)]/20 blur-3xl" />
            <div className="absolute -top-4 -left-4 -z-10 h-24 w-24 rounded-full bg-[var(--accent-crimson)]/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
