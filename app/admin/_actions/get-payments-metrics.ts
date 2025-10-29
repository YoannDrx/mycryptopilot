/**
 * Payments Metrics Service
 *
 * Récupère les métriques de paiements crypto pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total revenue (confirmé)
 * - Revenue mensuel (30 derniers jours)
 * - Paiements en attente/échoués
 * - Split par réseau (BASE/TRON)
 * - Split par plan (PRO/ULTRA)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type PaymentsMetrics = {
  totalRevenue: number;
  revenueThisMonth: number;
  pendingCount: number;
  failedCount: number;
  networkSplit: {
    BASE: number;
    TRON: number;
    POLYGON: number;
    ETHEREUM: number;
  };
  planSplit: {
    PRO: number;
    ULTRA: number;
  };
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des paiements crypto
 *
 * Cette fonction:
 * 1. Calcule le revenue total (status = CONFIRMED)
 * 2. Calcule le revenue des 30 derniers jours
 * 3. Compte les paiements PENDING et FAILED
 * 4. Split par network (BASE/TRON/etc)
 * 5. Split par plan (PRO/ULTRA)
 */
export async function getPaymentsMetrics(): Promise<PaymentsMetrics> {
  logger.info("Fetching payments metrics");

  // Date limite pour "this month" (30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Total revenue (tous les paiements confirmés)
  const totalRevenueResult = await prisma.cryptoPayment.aggregate({
    where: { status: "CONFIRMED" },
    _sum: { amountUSD: true },
  });
  const totalRevenue = Number(totalRevenueResult._sum.amountUSD ?? 0);

  // 2. Revenue mensuel (30 derniers jours)
  const monthlyRevenueResult = await prisma.cryptoPayment.aggregate({
    where: {
      status: "CONFIRMED",
      confirmedAt: { gte: thirtyDaysAgo },
    },
    _sum: { amountUSD: true },
  });
  const revenueThisMonth = Number(monthlyRevenueResult._sum.amountUSD ?? 0);

  // 3. Pending payments count
  const pendingCount = await prisma.cryptoPayment.count({
    where: { status: "PENDING" },
  });

  // 4. Failed payments count
  const failedCount = await prisma.cryptoPayment.count({
    where: { status: "FAILED" },
  });

  // 5. Network split (revenue par network)
  const networkSplit = {
    BASE: 0,
    TRON: 0,
    POLYGON: 0,
    ETHEREUM: 0,
  };

  const networkResults = await prisma.cryptoPayment.groupBy({
    by: ["network"],
    where: { status: "CONFIRMED" },
    _sum: { amountUSD: true },
  });

  for (const result of networkResults) {
    if (result.network in networkSplit) {
      networkSplit[result.network as keyof typeof networkSplit] = Number(
        result._sum.amountUSD ?? 0,
      );
    }
  }

  // 6. Plan split (revenue par plan)
  const planResults = await prisma.cryptoPayment.groupBy({
    by: ["plan"],
    where: { status: "CONFIRMED" },
    _sum: { amountUSD: true },
  });

  const planSplit = {
    PRO: 0,
    ULTRA: 0,
  };

  for (const result of planResults) {
    const planName = result.plan.toUpperCase();
    if (planName === "PRO" || planName === "ULTRA") {
      planSplit[planName as keyof typeof planSplit] = Number(
        result._sum.amountUSD ?? 0,
      );
    }
  }

  const metrics: PaymentsMetrics = {
    totalRevenue,
    revenueThisMonth,
    pendingCount,
    failedCount,
    networkSplit,
    planSplit,
    lastUpdated: new Date(),
  };

  logger.info("Payments metrics calculated", {
    totalRevenue,
    revenueThisMonth,
    pendingCount,
    failedCount,
  });

  return metrics;
}
