import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { TierLevel } from "@/generated/prisma";

/**
 * Tier Service
 *
 * Module centralisé pour gérer le système de tiers du referral system
 *
 * Responsabilités:
 * - Récupérer le tier actuel d'un trader
 * - Vérifier et upgrade automatiquement les tiers
 * - Calculer la progression vers le prochain tier
 * - Gérer les rewards par tier
 *
 * Architecture:
 * - Appelé depuis cron job daily pour check tous les traders
 * - Utilisé dans UI pour afficher tier actuel + progress
 */

/**
 * Tier requirements configuration
 *
 * Définit les seuils d'invités actifs pour chaque tier
 */
export const TIER_REQUIREMENTS: Record<
  TierLevel,
  {
    minActiveInvites: number;
    maxActiveInvites: number | null;
    rewards: {
      badge: string;
      description: string;
      benefits: string[];
    };
  }
> = {
  BRONZE: {
    minActiveInvites: 0,
    maxActiveInvites: 9,
    rewards: {
      badge: "🥉 Bronze",
      description: "Starting tier",
      benefits: ["Referral system access", "Earn credits from invites"],
    },
  },
  SILVER: {
    minActiveInvites: 10,
    maxActiveInvites: 49,
    rewards: {
      badge: "🥈 Silver",
      description: "Growing community",
      benefits: [
        "All Bronze benefits",
        "10% discount on Pro plan (lifetime)",
        "Priority support",
      ],
    },
  },
  GOLD: {
    minActiveInvites: 50,
    maxActiveInvites: 99,
    rewards: {
      badge: "🥇 Gold",
      description: "Established trader",
      benefits: [
        "All Silver benefits",
        "3 months Pro plan free",
        "Featured in marketplace",
        "20% discount on Ultra plan (lifetime)",
      ],
    },
  },
  DIAMOND: {
    minActiveInvites: 100,
    maxActiveInvites: null, // Unlimited
    rewards: {
      badge: "💎 Diamond",
      description: "Elite status",
      benefits: [
        "All Gold benefits",
        "3 months Ultra plan free",
        "Top placement in marketplace",
        "Ultra plan free lifetime (100+ active invites)",
        "Custom profile badge",
      ],
    },
  },
};

/**
 * Détermine le tier approprié selon le nombre d'invités actifs
 */
function calculateTierFromActiveCount(activeCount: number): TierLevel {
  if (activeCount >= TIER_REQUIREMENTS.DIAMOND.minActiveInvites) {
    return "DIAMOND";
  }
  if (activeCount >= TIER_REQUIREMENTS.GOLD.minActiveInvites) {
    return "GOLD";
  }
  if (activeCount >= TIER_REQUIREMENTS.SILVER.minActiveInvites) {
    return "SILVER";
  }
  return "BRONZE";
}

/**
 * Récupère ou crée le ReferralTier d'un trader
 *
 * @param traderId - User ID du trader
 * @returns ReferralTier record
 */
export async function getOrCreateTier(traderId: string) {
  let tier = await prisma.referralTier.findUnique({
    where: { traderId },
  });

  if (!tier) {
    // Créer tier initial (BRONZE)
    tier = await prisma.referralTier.create({
      data: {
        traderId,
        tier: "BRONZE",
        activeInvitesCount: 0,
      },
    });

    logger.info("ReferralTier created", { traderId, tier: "BRONZE" });
  }

  return tier;
}

/**
 * Compte les invités actifs d'un trader
 *
 * Définition "actif":
 * - Invitation accepted
 * - inviteeActive = true (30+ jours actif)
 *
 * @param traderId - User ID du trader
 * @returns Nombre d'invités actifs
 */
export async function countActiveInvites(traderId: string): Promise<number> {
  const count = await prisma.traderInvitation.count({
    where: {
      traderId,
      status: "ACCEPTED",
      inviteeActive: true,
    },
  });

  return count;
}

/**
 * Check et upgrade le tier d'un trader si nécessaire
 *
 * @param traderId - User ID du trader
 * @returns Résultat avec upgrade info
 */
export async function checkAndUpgradeTier(traderId: string): Promise<{
  success: boolean;
  upgraded: boolean;
  previousTier?: TierLevel;
  newTier?: TierLevel;
  activeInvitesCount: number;
  error?: string;
}> {
  try {
    // 1. Count active invites
    const activeCount = await countActiveInvites(traderId);

    // 2. Get or create tier
    const currentTier = await getOrCreateTier(traderId);

    // 3. Calculate what tier should be
    const calculatedTier = calculateTierFromActiveCount(activeCount);

    // 4. Check if upgrade needed
    if (calculatedTier === currentTier.tier) {
      // No upgrade needed, just update cache
      if (currentTier.activeInvitesCount !== activeCount) {
        await prisma.referralTier.update({
          where: { traderId },
          data: { activeInvitesCount: activeCount },
        });
      }

      return {
        success: true,
        upgraded: false,
        activeInvitesCount: activeCount,
      };
    }

    // 5. Upgrade tier
    await prisma.referralTier.update({
      where: { traderId },
      data: {
        tier: calculatedTier,
        activeInvitesCount: activeCount,
        tierUpgradedAt: new Date(),
      },
    });

    logger.info("✅ Tier upgraded", {
      traderId,
      previousTier: currentTier.tier,
      newTier: calculatedTier,
      activeInvitesCount: activeCount,
    });

    return {
      success: true,
      upgraded: true,
      previousTier: currentTier.tier,
      newTier: calculatedTier,
      activeInvitesCount: activeCount,
    };
  } catch (error) {
    logger.error("Error checking/upgrading tier", { traderId, error });
    return {
      success: false,
      upgraded: false,
      activeInvitesCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Calcule la progression vers le prochain tier
 *
 * @param traderId - User ID du trader
 * @returns Progress info
 */
export async function getTierProgress(traderId: string): Promise<{
  currentTier: TierLevel;
  currentCount: number;
  nextTier: TierLevel | null;
  nextTierRequirement: number | null;
  progressPercentage: number;
  remaining: number;
}> {
  const tier = await getOrCreateTier(traderId);
  const activeCount = await countActiveInvites(traderId);

  // Update cache if different
  if (tier.activeInvitesCount !== activeCount) {
    await prisma.referralTier.update({
      where: { traderId },
      data: { activeInvitesCount: activeCount },
    });
  }

  const currentTierReq = TIER_REQUIREMENTS[tier.tier];

  // Determine next tier
  let nextTier: TierLevel | null = null;
  let nextTierRequirement: number | null = null;

  switch (tier.tier) {
    case "BRONZE":
      nextTier = "SILVER";
      nextTierRequirement = TIER_REQUIREMENTS.SILVER.minActiveInvites;
      break;
    case "SILVER":
      nextTier = "GOLD";
      nextTierRequirement = TIER_REQUIREMENTS.GOLD.minActiveInvites;
      break;
    case "GOLD":
      nextTier = "DIAMOND";
      nextTierRequirement = TIER_REQUIREMENTS.DIAMOND.minActiveInvites;
      break;
    case "DIAMOND":
      // Already max tier
      nextTier = null;
      nextTierRequirement = null;
      break;
  }

  // Calculate progress
  let progressPercentage = 0;
  let remaining = 0;

  if (nextTierRequirement !== null) {
    const currentMin = currentTierReq.minActiveInvites;
    const range = nextTierRequirement - currentMin;
    const progress = activeCount - currentMin;
    progressPercentage = Math.min(Math.round((progress / range) * 100), 100);
    remaining = Math.max(nextTierRequirement - activeCount, 0);
  } else {
    // Max tier reached
    progressPercentage = 100;
    remaining = 0;
  }

  return {
    currentTier: tier.tier,
    currentCount: activeCount,
    nextTier,
    nextTierRequirement,
    progressPercentage,
    remaining,
  };
}

/**
 * Récupère les rewards d'un tier spécifique
 *
 * @param tier - Tier level
 * @returns Rewards info
 */
export function getTierRewards(tier: TierLevel) {
  return TIER_REQUIREMENTS[tier].rewards;
}

/**
 * Récupère tous les tiers avec requirements pour affichage UI
 *
 * @returns Array de tous les tiers
 */
export function getAllTiersInfo() {
  return Object.entries(TIER_REQUIREMENTS).map(([tier, req]) => ({
    tier: tier as TierLevel,
    minActiveInvites: req.minActiveInvites,
    maxActiveInvites: req.maxActiveInvites,
    rewards: req.rewards,
  }));
}
