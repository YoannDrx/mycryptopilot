"use client";

import { Typography } from "@/components/nowts/typography";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Repeat,
  Search,
} from "lucide-react";
import { SectionLayout } from "./section-layout";

const CYCLE_STEPS = [
  {
    icon: Search,
    title: "Discover",
    description: "Find verified traders with transparent Binance/Bybit stats",
    features: [
      "Marketplace with real performance data",
      "Filter by winrate, drawdown, strategy",
      "On-chain verification (no fake screenshots)",
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Measure",
    description: "Calculate risk and manage your positions with precision",
    features: [
      "Risk console (2% rule automated)",
      "Position sizing calculator",
      "Real-time P&L tracking",
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: CheckCircle2,
    title: "Adjust",
    description: "Execute trades and monitor your performance",
    features: [
      "Structured signal cards (Entry/TP/SL)",
      "Copy-trading (manual now, automated soon)",
      "Trading journal for every trade",
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Repeat,
    title: "Automate",
    description: "Scale your strategy with analytics and automation",
    features: [
      "Performance analytics (Sharpe, Sortino, MDD)",
      "Multi-exchange portfolio tracking",
      "Advanced filters & custom alerts",
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function EcosystemCycleSection() {
  return (
    <SectionLayout id="ecosystem" size="lg">
      <div className="flex flex-col gap-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Typography variant="h2" className="text-4xl font-bold md:text-5xl">
            More than signals. A complete 360° ecosystem.
          </Typography>
          <Typography variant="large" className="text-muted-foreground mt-6">
            MyCryptoPilot covers your entire trading cycle—from discovering
            verified traders to automating your strategy with analytics.
          </Typography>
        </div>

        {/* Timeline Visual */}
        <div className="relative">
          {/* Connecting Line (desktop only) */}
          <div className="absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-blue-500 via-green-500 via-purple-500 to-orange-500 opacity-20 lg:block" />

          {/* Steps */}
          <div className="grid gap-8 lg:gap-12">
            {CYCLE_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={step.title}
                  className="relative grid gap-8 lg:grid-cols-2 lg:gap-12"
                >
                  {/* Desktop: Alternate left/right */}
                  {isEven ? (
                    <>
                      {/* Content Left */}
                      <Card className="shadow-lg lg:ml-auto">
                        <CardContent className="flex flex-col gap-4 p-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`${step.bgColor} ${step.color} flex size-12 shrink-0 items-center justify-center rounded-lg`}
                            >
                              <Icon className="size-6" />
                            </div>
                            <div>
                              <Typography
                                variant="small"
                                className="text-muted-foreground"
                              >
                                Step {index + 1}
                              </Typography>
                              <Typography
                                variant="h3"
                                className="text-2xl font-bold"
                              >
                                {step.title}
                              </Typography>
                            </div>
                          </div>
                          <Typography
                            variant="p"
                            className="text-muted-foreground"
                          >
                            {step.description}
                          </Typography>
                          <ul className="flex flex-col gap-2">
                            {step.features.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-start gap-2"
                              >
                                <CheckCircle2
                                  className={`${step.color} mt-0.5 size-5 shrink-0`}
                                />
                                <Typography variant="small">
                                  {feature}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Spacer Right */}
                      <div className="hidden lg:block" />
                    </>
                  ) : (
                    <>
                      {/* Spacer Left */}
                      <div className="hidden lg:block" />

                      {/* Content Right */}
                      <Card className="shadow-lg lg:mr-auto">
                        <CardContent className="flex flex-col gap-4 p-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`${step.bgColor} ${step.color} flex size-12 shrink-0 items-center justify-center rounded-lg`}
                            >
                              <Icon className="size-6" />
                            </div>
                            <div>
                              <Typography
                                variant="small"
                                className="text-muted-foreground"
                              >
                                Step {index + 1}
                              </Typography>
                              <Typography
                                variant="h3"
                                className="text-2xl font-bold"
                              >
                                {step.title}
                              </Typography>
                            </div>
                          </div>
                          <Typography
                            variant="p"
                            className="text-muted-foreground"
                          >
                            {step.description}
                          </Typography>
                          <ul className="flex flex-col gap-2">
                            {step.features.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-start gap-2"
                              >
                                <CheckCircle2
                                  className={`${step.color} mt-0.5 size-5 shrink-0`}
                                />
                                <Typography variant="small">
                                  {feature}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Arrow connector (mobile only) */}
                  {index < CYCLE_STEPS.length - 1 && (
                    <div className="flex justify-center lg:hidden">
                      <ArrowRight
                        className={`${step.color} size-8 rotate-90`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-muted/50 mx-auto max-w-2xl rounded-lg p-8 text-center">
          <Typography variant="h3" className="text-2xl font-bold">
            Not just another signal provider
          </Typography>
          <Typography variant="p" className="text-muted-foreground mt-3">
            We built a complete risk-first trading ecosystem so you can
            discover, measure, execute, and automate—all in one place.
          </Typography>
        </div>
      </div>
    </SectionLayout>
  );
}
