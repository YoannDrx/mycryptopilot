/**
 * Follows Metrics Service
 *
 * Récupère les métriques de follows pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total follows actifs
 * - Nouveaux follows (30 derniers jours)
 * - Conversion vers plans payants
 * - Moyenne follows par user
 * - Breakdown par source (DIRECT/INVITATION/REFERRAL)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type FollowsMetrics = {
  activeFollows: number;
  newFollowsThisMonth: number;
  paidConversionRate: number; // % de follows avec user payant
  avgFollowsPerUser: number;
  sourceSplit: {
    DIRECT: number;
    INVITATION: number;
    REFERRAL: number;
  };
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des follows
 *
 * Cette fonction:
 * 1. Compte les follows actifs (status = ACTIVE)
 * 2. Compte les nouveaux follows (30 derniers jours)
 * 3. Calcule le taux de conversion vers plans payants
 * 4. Calcule la moyenne de follows par user
 * 5. Split par source (DIRECT/INVITATION/REFERRAL)
 */
export async function getFollowsMetrics(): Promise<FollowsMetrics> {
  logger.info("Fetching follows metrics");

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Active follows (status = ACTIVE)
  const activeFollows = await prisma.follow.count({
    where: {
      status: "ACTIVE",
    },
  });

  // 2. Nouveaux follows (créés dans les 30 derniers jours)
  const newFollowsThisMonth = await prisma.follow.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // 3. Conversion vers plans payants
  // Compter les follows ACTIFS dont le user a un plan payant actif
  const paidFollowsCount = await prisma.follow.count({
    where: {
      status: "ACTIVE",
      user: {
        planName: { in: ["pro", "ultra"] },
        planExpiresAt: { gt: now },
      },
    },
  });

  const paidConversionRate =
    activeFollows > 0 ? (paidFollowsCount / activeFollows) * 100 : 0;

  // 4. Moyenne follows par user
  const totalUsers = await prisma.user.count();
  const avgFollowsPerUser = totalUsers > 0 ? activeFollows / totalUsers : 0;

  // 5. Source split (count par source)
  const sourceSplit = {
    DIRECT: 0,
    INVITATION: 0,
    REFERRAL: 0,
  };

  const sourceResults = await prisma.follow.groupBy({
    by: ["source"],
    where: { status: "ACTIVE" },
    _count: { id: true },
  });

  for (const result of sourceResults) {
    if (result.source in sourceSplit) {
      sourceSplit[result.source as keyof typeof sourceSplit] = result._count.id;
    }
  }

  const metrics: FollowsMetrics = {
    activeFollows,
    newFollowsThisMonth,
    paidConversionRate,
    avgFollowsPerUser,
    sourceSplit,
    lastUpdated: new Date(),
  };

  logger.info("Follows metrics calculated", {
    activeFollows,
    newFollowsThisMonth,
    paidConversionRate,
    avgFollowsPerUser,
  });

  return metrics;
}
