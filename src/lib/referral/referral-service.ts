import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { CreditType } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";

/**
 * Referral Service
 *
 * Module centralisé pour gérer le système de credits du referral system
 *
 * Responsabilités:
 * - Award credits aux traders pour différentes actions (signup, active, upgrade, etc.)
 * - Gérer le solde de credits (balance)
 * - Permettre aux traders de dépenser leurs credits (rewards catalog)
 * - Fournir l'historique des transactions
 *
 * Architecture:
 * - Appelé depuis invitation tracking, subscription hooks, admin actions
 * - Utilise ReferralCredit pour transactions (+ ou -)
 * - Utilise ReferralReward pour audit trail des rewards gagnés
 * - Update TraderInvitation.creditsAwarded pour tracking par invitation
 */

type AwardCreditsParams = {
  traderId: string;
  amount: number;
  type: CreditType;
  reason?: string;
  metadata?: Record<string, unknown>;
  invitationId?: string; // Optional: pour lier à une invitation spécifique
};

type AwardCreditsResult = {
  success: boolean;
  creditId?: string;
  newBalance?: number;
  error?: string;
};

type SpendCreditsParams = {
  traderId: string;
  amount: number;
  type: CreditType;
  reason?: string;
  metadata?: Record<string, unknown>;
};

type SpendCreditsResult = {
  success: boolean;
  creditId?: string;
  newBalance?: number;
  error?: string;
};

type CreditBalance = {
  traderId: string;
  balance: number;
};

/**
 * Award credits à un trader pour une action spécifique
 *
 * Crée un ReferralCredit positif et un ReferralReward pour audit trail
 * Si invitationId fourni, update TraderInvitation.creditsAwarded
 *
 * @param params - Paramètres d'attribution de credits
 * @returns AwardCreditsResult avec succès/erreur
 */
export async function awardCredits(
  params: AwardCreditsParams,
): Promise<AwardCreditsResult> {
  const { traderId, amount, type, reason, metadata, invitationId } = params;

  if (amount <= 0) {
    logger.error("Cannot award negative or zero credits", {
      traderId,
      amount,
      type,
    });
    return {
      success: false,
      error: "Amount must be positive",
    };
  }

  // Vérifier que le type est bien un EARNED_*
  if (!type.startsWith("EARNED_")) {
    logger.error("Invalid credit type for awarding", { traderId, type });
    return {
      success: false,
      error: `Invalid credit type for awarding: ${type}`,
    };
  }

  logger.info("Awarding credits", {
    traderId,
    amount,
    type,
    reason,
    invitationId,
  });

  try {
    // Transaction pour créer ReferralCredit + ReferralReward + update invitation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le ReferralCredit
      const credit = await tx.referralCredit.create({
        data: {
          traderId,
          amount,
          type,
          reason,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });

      // 2. Créer le ReferralReward (audit trail)
      const action = getActionFromCreditType(type);
      await tx.referralReward.create({
        data: {
          traderId,
          inviteeId: metadata?.inviteeId
            ? String(metadata.inviteeId)
            : undefined,
          action,
          creditsAwarded: amount,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });

      // 3. Update TraderInvitation.creditsAwarded si invitationId fourni
      if (invitationId) {
        await tx.traderInvitation.update({
          where: { id: invitationId },
          data: {
            creditsAwarded: {
              increment: amount,
            },
          },
        });
      }

      return credit;
    });

    // 4. Calculer le nouveau solde
    const newBalance = await getCreditBalance(traderId);

    logger.info("✅ Credits awarded successfully", {
      traderId,
      creditId: result.id,
      amount,
      type,
      newBalance,
    });

    return {
      success: true,
      creditId: result.id,
      newBalance,
    };
  } catch (error) {
    logger.error("Error awarding credits", { traderId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Dépenser des credits (trader rachète un reward)
 *
 * Vérifie que le solde est suffisant
 * Crée un ReferralCredit négatif avec type SPENT_*
 *
 * @param params - Paramètres de dépense de credits
 * @returns SpendCreditsResult avec succès/erreur
 */
export async function spendCredits(
  params: SpendCreditsParams,
): Promise<SpendCreditsResult> {
  const { traderId, amount, type, reason, metadata } = params;

  if (amount <= 0) {
    logger.error("Cannot spend negative or zero credits", {
      traderId,
      amount,
      type,
    });
    return {
      success: false,
      error: "Amount must be positive",
    };
  }

  // Vérifier que le type est bien un SPENT_*
  if (!type.startsWith("SPENT_")) {
    logger.error("Invalid credit type for spending", { traderId, type });
    return {
      success: false,
      error: `Invalid credit type for spending: ${type}`,
    };
  }

  logger.info("Spending credits", { traderId, amount, type, reason });

  try {
    // 1. Vérifier le solde disponible
    const currentBalance = await getCreditBalance(traderId);

    if (currentBalance < amount) {
      logger.warn("Insufficient credits", {
        traderId,
        currentBalance,
        required: amount,
      });
      return {
        success: false,
        error: `Insufficient credits. Current balance: ${currentBalance}, required: ${amount}`,
      };
    }

    // 2. Créer le ReferralCredit négatif
    const credit = await prisma.referralCredit.create({
      data: {
        traderId,
        amount: -amount, // NEGATIF pour dépense
        type,
        reason,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    // 3. Calculer le nouveau solde
    const newBalance = await getCreditBalance(traderId);

    logger.info("✅ Credits spent successfully", {
      traderId,
      creditId: credit.id,
      amount,
      type,
      newBalance,
    });

    return {
      success: true,
      creditId: credit.id,
      newBalance,
    };
  } catch (error) {
    logger.error("Error spending credits", { traderId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Obtenir le solde de credits d'un trader
 *
 * SUM de tous les ReferralCredit.amount (positifs et négatifs)
 *
 * @param traderId - User ID du trader
 * @returns Solde actuel en credits
 */
export async function getCreditBalance(traderId: string): Promise<number> {
  try {
    const result = await prisma.referralCredit.aggregate({
      where: { traderId },
      _sum: {
        amount: true,
      },
    });

    const balance = result._sum.amount ?? 0;

    logger.info("Credit balance retrieved", { traderId, balance });

    return balance;
  } catch (error) {
    logger.error("Error getting credit balance", { traderId, error });
    return 0;
  }
}

/**
 * Obtenir le solde de credits avec détails
 *
 * Inclut le total earned et total spent séparément
 *
 * @param traderId - User ID du trader
 * @returns Détails du solde
 */
export async function getCreditBalanceDetails(
  traderId: string,
): Promise<CreditBalance & { earned: number; spent: number }> {
  try {
    const [earnedResult, spentResult, balance] = await Promise.all([
      prisma.referralCredit.aggregate({
        where: {
          traderId,
          amount: { gt: 0 }, // Positifs uniquement
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.referralCredit.aggregate({
        where: {
          traderId,
          amount: { lt: 0 }, // Négatifs uniquement
        },
        _sum: {
          amount: true,
        },
      }),
      getCreditBalance(traderId),
    ]);

    const earned = earnedResult._sum.amount ?? 0;
    const spent = Math.abs(spentResult._sum.amount ?? 0); // Valeur absolue pour affichage

    return {
      traderId,
      balance,
      earned,
      spent,
    };
  } catch (error) {
    logger.error("Error getting credit balance details", { traderId, error });
    return {
      traderId,
      balance: 0,
      earned: 0,
      spent: 0,
    };
  }
}

/**
 * Obtenir l'historique des transactions de credits
 *
 * @param traderId - User ID du trader
 * @param limit - Nombre max de transactions à retourner (défaut: 50)
 * @returns Liste des transactions
 */
export async function getRewardsHistory(traderId: string, limit = 50) {
  try {
    const credits = await prisma.referralCredit.findMany({
      where: { traderId },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    logger.info("Rewards history retrieved", {
      traderId,
      count: credits.length,
    });

    return credits;
  } catch (error) {
    logger.error("Error getting rewards history", { traderId, error });
    return [];
  }
}

/**
 * Obtenir les rewards gagnés (audit trail)
 *
 * @param traderId - User ID du trader
 * @param limit - Nombre max de rewards à retourner (défaut: 50)
 * @returns Liste des rewards gagnés
 */
export async function getRewardsEarned(traderId: string, limit = 50) {
  try {
    const rewards = await prisma.referralReward.findMany({
      where: { traderId },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    logger.info("Rewards earned retrieved", {
      traderId,
      count: rewards.length,
    });

    return rewards;
  } catch (error) {
    logger.error("Error getting rewards earned", { traderId, error });
    return [];
  }
}

/**
 * Clawback credits en cas de fraude détectée
 *
 * Retire des credits avec type CLAWBACK_FRAUD
 *
 * @param traderId - User ID du trader
 * @param amount - Montant à retirer (positif)
 * @param reason - Raison du clawback
 * @returns SpendCreditsResult
 */
export async function clawbackCredits(
  traderId: string,
  amount: number,
  reason: string,
): Promise<SpendCreditsResult> {
  logger.warn("Clawback credits for fraud", { traderId, amount, reason });

  try {
    // Créer un ReferralCredit négatif avec type CLAWBACK_FRAUD
    const credit = await prisma.referralCredit.create({
      data: {
        traderId,
        amount: -amount, // NEGATIF
        type: "CLAWBACK_FRAUD",
        reason,
        metadata: {
          clawbackDate: new Date().toISOString(),
        },
      },
    });

    const newBalance = await getCreditBalance(traderId);

    logger.info("✅ Credits clawed back", {
      traderId,
      creditId: credit.id,
      amount,
      newBalance,
    });

    return {
      success: true,
      creditId: credit.id,
      newBalance,
    };
  } catch (error) {
    logger.error("Error clawing back credits", { traderId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper: Convertir CreditType vers action string pour ReferralReward
 */
function getActionFromCreditType(type: CreditType): string {
  const mapping: Record<string, string> = {
    EARNED_SIGNUP: "signup",
    EARNED_ACTIVE: "active_30d",
    EARNED_UPGRADE_PRO: "upgrade_pro",
    EARNED_UPGRADE_ULTRA: "upgrade_ultra",
    EARNED_RETENTION_3M: "retention_3m",
  };

  return mapping[type] ?? type.toLowerCase();
}
