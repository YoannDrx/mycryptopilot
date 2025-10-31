/**
 * Users Metrics Service
 *
 * Récupère les métriques utilisateurs pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total users
 * - Nouveaux users (30 derniers jours)
 * - Email verified
 * - Banned users
 * - Conversion rate vers plans payants
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type UsersMetrics = {
  totalUsers: number;
  newUsersThisMonth: number;
  emailVerified: number;
  bannedUsers: number;
  paidUsers: number;
  conversionRate: number; // % de users avec plan payant
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des utilisateurs
 *
 * Cette fonction:
 * 1. Compte le total des users
 * 2. Compte les nouveaux users (30 derniers jours)
 * 3. Compte les users avec email verified
 * 4. Compte les users banned
 * 5. Compte les users avec plan payant actif (Pro/Ultra)
 * 6. Calcule le taux de conversion vers payant
 */
export async function getUsersMetrics(): Promise<UsersMetrics> {
  logger.info("Fetching users metrics");

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Total users
  const totalUsers = await prisma.user.count();

  // 2. Nouveaux users (créés dans les 30 derniers jours)
  const newUsersThisMonth = await prisma.user.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // 3. Email verified
  const emailVerified = await prisma.user.count({
    where: {
      emailVerified: true,
    },
  });

  // 4. Banned users
  const bannedUsers = await prisma.user.count({
    where: {
      banned: true,
    },
  });

  // 5. Paid users (Pro ou Ultra avec plan actif)
  const paidUsers = await prisma.user.count({
    where: {
      planName: { in: ["pro", "ultra"] },
      planExpiresAt: { gt: now },
    },
  });

  // 6. Taux de conversion vers payant
  const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

  const metrics: UsersMetrics = {
    totalUsers,
    newUsersThisMonth,
    emailVerified,
    bannedUsers,
    paidUsers,
    conversionRate,
    lastUpdated: new Date(),
  };

  logger.info("Users metrics calculated", {
    totalUsers,
    newUsersThisMonth,
    emailVerified,
    bannedUsers,
    paidUsers,
    conversionRate,
  });

  return metrics;
}
