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
        <Typography variant="h1">I love trading crypto...</Typography>
        <Typography variant="large">
          But I waste time monitoring markets and missing opportunities
        </Typography>
        <div className="flex items-start gap-4 max-lg:flex-col">
          <div className="flex-1 rounded-lg bg-red-500/20 p-4 lg:p-6">
            <Typography variant="h3" className="text-red-500">
              😞 Trading without MyCryptoPilot
            </Typography>
            <ul className="text-foreground/80 mt-4 ml-4 flex list-disc flex-col gap-2 text-lg">
              <li>Manual monitoring of multiple exchanges</li>
              <li>Missing trading opportunities while away</li>
              <li>Emotional trading decisions</li>
              <li>Inconsistent strategy execution</li>
            </ul>
          </div>
          <div className="flex-1 rounded-lg bg-green-500/20 p-4 lg:p-6">
            <Typography variant="h3" className="text-green-500">
              😎 Trading WITH MyCryptoPilot
            </Typography>
            <ul className="text-foreground/80 mt-4 ml-4 flex list-disc flex-col gap-2 text-lg">
              <li>Automated market analysis and signals</li>
              <li>24/7 trading bot execution</li>
              <li>Discipline with risk-first approach</li>
              <li>Consistent profitable strategies</li>
            </ul>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};
