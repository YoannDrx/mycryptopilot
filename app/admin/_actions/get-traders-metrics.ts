/**
 * Traders Metrics Service
 *
 * Récupère les métriques traders pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total traders
 * - Traders verified
 * - Pending verification
 * - Nouveaux traders (30 derniers jours)
 * - Avec exchanges connectés
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type TradersMetrics = {
  totalTraders: number;
  verifiedTraders: number;
  pendingVerification: number;
  newTradersThisMonth: number;
  withExchanges: number;
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des traders
 *
 * Cette fonction:
 * 1. Compte le total des traders
 * 2. Compte les traders verified (verified = true)
 * 3. Compte les traders en attente (verified = false)
 * 4. Compte les nouveaux traders (30 derniers jours)
 * 5. Compte les traders avec exchanges connectés
 */
export async function getTradersMetrics(): Promise<TradersMetrics> {
  logger.info("Fetching traders metrics");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Total traders
  const totalTraders = await prisma.traderProfile.count();

  // 2. Verified traders
  const verifiedTraders = await prisma.traderProfile.count({
    where: {
      verified: true,
    },
  });

  // 3. Pending verification
  const pendingVerification = await prisma.traderProfile.count({
    where: {
      verified: false,
    },
  });

  // 4. Nouveaux traders (créés dans les 30 derniers jours)
  const newTradersThisMonth = await prisma.traderProfile.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // 5. Traders avec exchanges connectés
  const withExchanges = await prisma.traderProfile.count({
    where: {
      exchangeConnections: {
        some: {},
      },
    },
  });

  const metrics: TradersMetrics = {
    totalTraders,
    verifiedTraders,
    pendingVerification,
    newTradersThisMonth,
    withExchanges,
    lastUpdated: new Date(),
  };

  logger.info("Traders metrics calculated", {
    totalTraders,
    verifiedTraders,
    pendingVerification,
    newTradersThisMonth,
    withExchanges,
  });

  return metrics;
}
