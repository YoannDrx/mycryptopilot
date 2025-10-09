import { prisma } from "@/lib/prisma";
import { SectionLayout } from "./section-layout";
import { StatsClient } from "./stats-section-client";

type TraderStatsJson = {
  winrate?: number;
  payoff?: number;
  maxDD?: number;
  nTrades?: number;
  expectancy?: number;
};

async function getStats() {
  const [totalSignals, verifiedTraders, totalUsers, avgWinRate] =
    await Promise.all([
      prisma.signal.count(),
      prisma.traderProfile.count({ where: { verified: true } }),
      prisma.user.count(),
      prisma.traderProfile
        .findMany({
          where: { verified: true },
          select: { statsJson: true },
        })
        .then((traders) => {
          const winrates = traders
            .map((t) => {
              const stats = t.statsJson as TraderStatsJson;
              return stats.winrate ?? 0;
            })
            .filter((w) => w > 0);
          return winrates.length > 0
            ? winrates.reduce((a, b) => a + b, 0) / winrates.length
            : 58;
        }),
    ]);

  return [
    {
      number: totalSignals > 1000 ? totalSignals / 1000 : totalSignals,
      suffix: totalSignals > 1000 ? "K+" : "+",
      text: "Trading signals sent every month",
    },
    {
      number: avgWinRate,
      suffix: "%",
      text: "Average win rate of our verified traders",
    },
    {
      number: verifiedTraders,
      suffix: "",
      text: "Active and verified professional traders",
    },
    {
      number: totalUsers,
      suffix: "+",
      text: "Traders who trust us",
    },
  ];
}

export async function StatsSection() {
  const stats = await getStats();

  return (
    <SectionLayout size="sm">
      <div className="grid w-full items-center gap-12 sm:grid-cols-2 md:-mx-5 md:max-w-none md:grid-cols-4 md:gap-0">
        {stats.map((stat, index) => (
          <StatsClient key={index} stat={stat} />
        ))}
      </div>
    </SectionLayout>
  );
}
