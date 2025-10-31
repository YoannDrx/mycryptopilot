/**
 * Referrals Metrics Service
 *
 * Récupère les métriques du système de referral pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total invitations envoyées
 * - Invitations acceptées
 * - Total credits awarded
 * - Breakdown par tier (BRONZE/SILVER/GOLD/DIAMOND)
 * - Invitations upgradées (invitees devenus payants)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type ReferralsMetrics = {
  totalInvitations: number;
  acceptedInvitations: number;
  totalCreditsAwarded: number;
  upgradedInvitees: number;
  tierSplit: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    DIAMOND: number;
  };
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes du système de referral
 *
 * Cette fonction:
 * 1. Compte le total des invitations envoyées
 * 2. Compte les invitations acceptées (status = ACCEPTED)
 * 3. Somme les credits awarded (sum creditsAwarded)
 * 4. Compte les invitees upgradés (inviteeUpgraded = true)
 * 5. Split par tier (BRONZE/SILVER/GOLD/PLATINUM/DIAMOND)
 */
export async function getReferralsMetrics(): Promise<ReferralsMetrics> {
  logger.info("Fetching referrals metrics");

  // 1. Total invitations
  const totalInvitations = await prisma.traderInvitation.count();

  // 2. Accepted invitations (status = ACCEPTED)
  const acceptedInvitations = await prisma.traderInvitation.count({
    where: {
      status: "ACCEPTED",
    },
  });

  // 3. Total credits awarded (sum de creditsAwarded)
  const creditsResult = await prisma.traderInvitation.aggregate({
    _sum: { creditsAwarded: true },
  });
  const totalCreditsAwarded = creditsResult._sum.creditsAwarded ?? 0;

  // 4. Invitees upgradés (devenus payants)
  const upgradedInvitees = await prisma.traderInvitation.count({
    where: {
      inviteeUpgraded: true,
    },
  });

  // 5. Tier split (count par tier)
  const tierSplit = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
    DIAMOND: 0,
  };

  const tierResults = await prisma.referralTier.groupBy({
    by: ["tier"],
    _count: { id: true },
  });

  for (const result of tierResults) {
    if (result.tier in tierSplit) {
      tierSplit[result.tier as keyof typeof tierSplit] = result._count.id;
    }
  }

  const metrics: ReferralsMetrics = {
    totalInvitations,
    acceptedInvitations,
    totalCreditsAwarded,
    upgradedInvitees,
    tierSplit,
    lastUpdated: new Date(),
  };

  logger.info("Referrals metrics calculated", {
    totalInvitations,
    acceptedInvitations,
    totalCreditsAwarded,
    upgradedInvitees,
  });

  return metrics;
}
