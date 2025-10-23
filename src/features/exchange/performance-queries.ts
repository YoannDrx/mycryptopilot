import { prisma } from "@/lib/prisma";
import type { PerformancePeriod } from "@/generated/prisma";

/**
 * Get performance snapshot for a trader and specific period
 *
 * @param traderProfileId - The trader profile ID
 * @param period - The performance period (ALL_TIME, LAST_30D, etc.)
 * @returns Performance snapshot or null
 */
export async function getPerformanceSnapshot(
  traderProfileId: string,
  period: PerformancePeriod,
) {
  return prisma.traderPerformanceSnapshot.findUnique({
    where: {
      traderProfileId_period: {
        traderProfileId,
        period,
      },
    },
  });
}

/**
 * Get all performance snapshots for a trader (all periods)
 *
 * @param traderProfileId - The trader profile ID
 * @returns Array of performance snapshots for all periods
 */
export async function getAllPerformanceSnapshots(traderProfileId: string) {
  return prisma.traderPerformanceSnapshot.findMany({
    where: {
      traderProfileId,
    },
    orderBy: {
      calculatedAt: "desc",
    },
  });
}

/**
 * Check if trader has any performance data
 *
 * @param traderProfileId - The trader profile ID
 * @returns Boolean - true if trader has at least one snapshot
 */
export async function hasPerformanceData(traderProfileId: string) {
  const count = await prisma.traderPerformanceSnapshot.count({
    where: {
      traderProfileId,
    },
  });

  return count > 0;
}

/**
 * Get trader's best performing period
 *
 * @param traderProfileId - The trader profile ID
 * @returns Period with highest winrate or null
 */
export async function getBestPerformingPeriod(traderProfileId: string) {
  const snapshots = await prisma.traderPerformanceSnapshot.findMany({
    where: {
      traderProfileId,
      totalTrades: { gt: 0 }, // Only periods with trades
    },
    orderBy: {
      winrate: "desc",
    },
    take: 1,
  });

  return snapshots[0] ?? null;
}

/**
 * Check if trader has verified stats (has at least one active exchange connection)
 *
 * @param traderProfileId - The trader profile ID
 * @returns Boolean - true if trader has verified stats
 */
export async function hasVerifiedStats(traderProfileId: string) {
  const activeConnectionsCount = await prisma.exchangeConnection.count({
    where: {
      traderProfileId,
      isActive: true,
    },
  });

  return activeConnectionsCount > 0;
}
