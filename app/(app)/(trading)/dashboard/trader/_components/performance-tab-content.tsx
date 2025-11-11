"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { upfetch } from "@/lib/up-fetch";
import type { PerformancePeriod } from "@/generated/prisma";
import { PeriodSelector } from "@/components/nowts/period-selector";
import { PerformanceStatsDisplay } from "./performance-stats-display";
import type { TraderPerformanceSnapshot } from "@/generated/prisma";

type PerformanceTabContentProps = {
  traderProfileId: string;
  userPlanName?: string | null;
};

type PerformanceSnapshotResponse = {
  snapshot: TraderPerformanceSnapshot | null;
};

export const PerformanceTabContent = ({
  traderProfileId,
  userPlanName = null,
}: PerformanceTabContentProps) => {
  const [period, setPeriod] = useState<PerformancePeriod>("ALL_TIME");

  const { data, isLoading } = useQuery({
    queryKey: ["performance-snapshot", traderProfileId, period],
    queryFn: async () => {
      // upfetch retourne DÉJÀ le JSON parsé et throw si erreur HTTP
      const result = (await upfetch(
        `/api/performance/${traderProfileId}/${period}`,
      )) as PerformanceSnapshotResponse;

      return result;
    },
  });

  return (
    <div className="space-y-6">
      <PeriodSelector value={period} onChange={setPeriod} />
      <PerformanceStatsDisplay
        snapshot={data?.snapshot ?? null}
        loading={isLoading}
        userPlanName={userPlanName}
      />
    </div>
  );
};
