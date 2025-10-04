"use client";

import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "./section-layout";

export const PainSection = () => {
  return (
    <SectionLayout
      variant="card"
      size="base"
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="flex w-full flex-col items-center gap-3 lg:gap-4 xl:gap-6">
        <Typography variant="h1">
          Trading crypto without guidance is...
        </Typography>
        <Typography variant="large">
          90% of retail traders lose money. Here's why.
        </Typography>
        <div className="flex w-full items-start gap-6 max-lg:flex-col">
          {/* Trading Solo Card */}
          <div className="group relative flex-1 overflow-hidden rounded-2xl p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 opacity-75 blur-sm transition-opacity group-hover:opacity-100" />
            <div className="bg-background relative rounded-2xl p-6 lg:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-4xl">😞</span>
                <Typography
                  variant="h3"
                  className="bg-gradient-to-br from-red-400 to-orange-500 bg-clip-text text-transparent"
                >
                  Trading Solo
                </Typography>
              </div>
              <ul className="text-foreground/80 flex list-none flex-col gap-3 text-base">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg text-red-500/70">✕</span>
                  <span>Recurring losses due to lack of experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg text-red-500/70">✕</span>
                  <span>FOMO and emotional decisions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg text-red-500/70">✕</span>
                  <span>No strategy or risk management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg text-red-500/70">✕</span>
                  <span>Overtrading and liquidations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg text-red-500/70">✕</span>
                  <span>Unable to track mistakes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Trading with MyCryptoPilot Card */}
          <div className="group relative flex-1 overflow-hidden rounded-2xl p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm transition-opacity group-hover:opacity-100" />
            <div className="bg-background relative rounded-2xl p-6 lg:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-4xl">😎</span>
                <Typography
                  variant="h3"
                  className="bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  With MyCryptoPilot
                </Typography>
              </div>
              <ul className="text-foreground/80 flex list-none flex-col gap-3 text-base">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-lg">✓</span>
                  <span>Structured signals from verified traders</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-lg">✓</span>
                  <span>Detailed rationales to understand</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-lg">✓</span>
                  <span>Risk console to protect your capital</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-lg">✓</span>
                  <span>Transparent stats (win rate, drawdown)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 text-lg">✓</span>
                  <span>Journal to track your progress</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};
