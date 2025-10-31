/**
 * Signals Metrics Service
 *
 * Récupère les métriques signaux pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total signals publiés
 * - Signals actifs (non expirés)
 * - Nouveaux signals (30 derniers jours)
 * - TTL moyen des signaux
 * - Top trader (plus de signaux)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type SignalsMetrics = {
  totalSignals: number;
  activeSignals: number;
  newSignalsThisMonth: number;
  avgTTLHours: number;
  topTrader: {
    name: string;
    count: number;
  } | null;
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des signaux
 *
 * Cette fonction:
 * 1. Compte le total des signaux publiés
 * 2. Compte les signaux actifs (expiresAt > now)
 * 3. Compte les nouveaux signaux (30 derniers jours)
 * 4. Calcule le TTL moyen en heures
 * 5. Trouve le top trader (plus de signaux)
 */
export async function getSignalsMetrics(): Promise<SignalsMetrics> {
  logger.info("Fetching signals metrics");

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Total signals
  const totalSignals = await prisma.signal.count();

  // 2. Active signals (expiresAt > now)
  const activeSignals = await prisma.signal.count({
    where: {
      expiresAt: { gt: now },
    },
  });

  // 3. Nouveaux signals (créés dans les 30 derniers jours)
  const newSignalsThisMonth = await prisma.signal.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // 4. TTL moyen (en heures)
  const avgTTLResult = await prisma.signal.aggregate({
    _avg: { ttlSec: true },
  });
  const avgTTLHours = avgTTLResult._avg.ttlSec
    ? avgTTLResult._avg.ttlSec / 3600
    : 0;

  // 5. Top trader (plus de signaux)
  const topTraderResult = await prisma.signal.groupBy({
    by: ["traderId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 1,
  });

  let topTrader: SignalsMetrics["topTrader"] = null;

  if (topTraderResult.length > 0) {
    const topTraderId = topTraderResult[0].traderId;
    const trader = await prisma.user.findUnique({
      where: { id: topTraderId },
      select: { name: true },
    });

    if (trader) {
      topTrader = {
        name: trader.name,
        count: topTraderResult[0]._count.id,
      };
    }
  }

  const metrics: SignalsMetrics = {
    totalSignals,
    activeSignals,
    newSignalsThisMonth,
    avgTTLHours,
    topTrader,
    lastUpdated: new Date(),
  };

  logger.info("Signals metrics calculated", {
    totalSignals,
    activeSignals,
    newSignalsThisMonth,
    avgTTLHours,
  });

  return metrics;
}
