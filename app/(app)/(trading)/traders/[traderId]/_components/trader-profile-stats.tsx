"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users } from "lucide-react";

type TraderProfileStatsProps = {
  traderId: string;
  initialFollowersCount?: number;
  initialSignalsCount?: number;
  winrate?: number;
};

export function TraderProfileStats({
  traderId,
  initialFollowersCount = 0,
  initialSignalsCount = 0,
  winrate,
}: TraderProfileStatsProps) {
  // Récupérer le nombre de followers en temps réel
  const { data: followersCount } = useQuery({
    queryKey: ["trader-followers", traderId],
    queryFn: async () => {
      const res = await fetch(
        `/api/follow/count-followers?traderId=${traderId}`,
      );
      if (!res.ok) return initialFollowersCount;
      const data = (await res.json()) as { count: number };
      return data.count;
    },
    initialData: initialFollowersCount,
  });

  // Récupérer le nombre de signaux en temps réel
  const { data: signalsCount } = useQuery({
    queryKey: ["trader-signals", traderId],
    queryFn: async () => {
      const res = await fetch(
        `/api/signals/count-by-trader?traderId=${traderId}`,
      );
      if (!res.ok) return initialSignalsCount;
      const data = (await res.json()) as { count: number };
      return data.count;
    },
    initialData: initialSignalsCount,
  });

  return (
    <div className="flex flex-wrap gap-4 pt-2">
      <div className="flex items-center gap-1.5">
        <Users className="text-muted-foreground size-4" />
        <span className="text-sm">
          {followersCount} {followersCount === 1 ? "follower" : "followers"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <TrendingUp className="text-muted-foreground size-4" />
        <span className="text-sm">
          {signalsCount} {signalsCount === 1 ? "signal" : "signals"}
        </span>
      </div>
      {typeof winrate === "number" && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">Winrate: {winrate}%</span>
        </div>
      )}
    </div>
  );
}
