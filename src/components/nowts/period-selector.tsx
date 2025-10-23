"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PerformancePeriod } from "@/generated/prisma";

type PeriodSelectorProps = {
  value: PerformancePeriod;
  onChange: (period: PerformancePeriod) => void;
  className?: string;
};

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  ALL_TIME: "All Time",
  LAST_30D: "30 Days",
  LAST_90D: "90 Days",
  LAST_365D: "1 Year",
};

export const PeriodSelector = ({
  value,
  onChange,
  className,
}: PeriodSelectorProps) => {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as PerformancePeriod)}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-4">
        {(Object.keys(PERIOD_LABELS) as PerformancePeriod[]).map((period) => (
          <TabsTrigger
            key={period}
            value={period}
            className="text-xs sm:text-sm"
          >
            {PERIOD_LABELS[period]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
