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

// Default stats to display when database is unavailable
const DEFAULT_STATS = [
  {
    number: 12,
    suffix: "K+",
    text: "Risk calculations automated every day",
  },
  {
    number: 2.5,
    suffix: "K+",
    text: "Trading signals streamed each month",
  },
  {
    number: 58,
    suffix: "%",
    text: "Average win rate of verified, exchange-synced traders",
  },
  {
    number: 15,
    suffix: "+",
    text: "Verified traders with Binance/Bybit proof",
  },
];

async function getStats() {
  try {
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
              .filter((t) => t.statsJson !== null)
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

    // Calculate estimated risk calculations per day
    const estimatedDailyCalculations = totalUsers * 4;

    return [
      {
        number:
          estimatedDailyCalculations > 1000
            ? estimatedDailyCalculations / 1000
            : estimatedDailyCalculations,
        suffix: estimatedDailyCalculations > 1000 ? "K+" : "+",
        text: "Risk calculations automated every day",
      },
      {
        number: totalSignals > 1000 ? totalSignals / 1000 : totalSignals,
        suffix: totalSignals > 1000 ? "K+" : "+",
        text: "Trading signals streamed each month",
      },
      {
        number: avgWinRate,
        suffix: "%",
        text: "Average win rate of verified, exchange-synced traders",
      },
      {
        number: verifiedTraders,
        suffix: "+",
        text: "Verified traders with Binance/Bybit proof",
      },
    ];
  } catch {
    // Return default stats when database is unavailable (e.g., quota exceeded)
    return DEFAULT_STATS;
  }
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
