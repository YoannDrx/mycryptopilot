/**
 * Subscriptions Metrics Service
 *
 * Récupère les métriques d'abonnements pour le dashboard admin.
 *
 * Métriques calculées:
 * - Count users par plan (Free/Pro/Ultra)
 * - Plans actifs (non expirés)
 * - Plans expirant dans 7 jours
 * - MRR (Monthly Recurring Revenue)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type SubscriptionsMetrics = {
  freeCount: number;
  proCount: number;
  ultraCount: number;
  expiringSoon: number; // Plans expirant dans 7 jours
  monthlyRecurringRevenue: number; // MRR calculé
  lastUpdated: Date;
};

// ====================================
// Configuration
// ====================================

const PLAN_PRICES = {
  pro: 49,
  ultra: 99,
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des abonnements
 *
 * Cette fonction:
 * 1. Compte les users FREE (planName = null or 'free')
 * 2. Compte les users PRO actifs (planName = 'pro' AND planExpiresAt > now)
 * 3. Compte les users ULTRA actifs (planName = 'ultra' AND planExpiresAt > now)
 * 4. Compte les plans expirant dans 7 jours
 * 5. Calcule le MRR (Pro * $49 + Ultra * $99)
 */
export async function getSubscriptionsMetrics(): Promise<SubscriptionsMetrics> {
  logger.info("Fetching subscriptions metrics");

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // 1. Free users (planName = null OR 'free' OR planExpiresAt < now)
  const freeCount = await prisma.user.count({
    where: {
      OR: [
        { planName: null },
        { planName: "free" },
        { planName: { in: ["pro", "ultra"] }, planExpiresAt: { lt: now } },
      ],
    },
  });

  // 2. Pro users actifs (planName = 'pro' AND planExpiresAt > now)
  const proCount = await prisma.user.count({
    where: {
      planName: "pro",
      planExpiresAt: { gt: now },
    },
  });

  // 3. Ultra users actifs (planName = 'ultra' AND planExpiresAt > now)
  const ultraCount = await prisma.user.count({
    where: {
      planName: "ultra",
      planExpiresAt: { gt: now },
    },
  });

  // 4. Plans expirant dans 7 jours
  const expiringSoon = await prisma.user.count({
    where: {
      planName: { in: ["pro", "ultra"] },
      planExpiresAt: {
        gt: now,
        lte: sevenDaysFromNow,
      },
    },
  });

  // 5. Calcul MRR (Monthly Recurring Revenue)
  // Hypothèse : tous les plans actifs sont renouvelés mensuellement
  const monthlyRecurringRevenue =
    proCount * PLAN_PRICES.pro + ultraCount * PLAN_PRICES.ultra;

  const metrics: SubscriptionsMetrics = {
    freeCount,
    proCount,
    ultraCount,
    expiringSoon,
    monthlyRecurringRevenue,
    lastUpdated: new Date(),
  };

  logger.info("Subscriptions metrics calculated", {
    freeCount,
    proCount,
    ultraCount,
    expiringSoon,
    monthlyRecurringRevenue,
  });

  return metrics;
}
