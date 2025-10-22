"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";
import {
  getCreditBalance,
  getCreditBalanceDetails,
  spendCredits,
  getRewardsHistory,
} from "@/lib/referral/referral-service";
import { activateSubscription } from "@/lib/subscription/subscription-manager";
import { logger } from "@/lib/logger";

/**
 * Schema pour valider la redemption d'un reward
 */
const RedeemRewardSchema = z.object({
  rewardId: z.string(),
  cost: z.number().positive(),
});

/**
 * Action pour récupérer le solde de credits de l'utilisateur
 */
export const getCreditBalanceAction = authAction.action(
  async ({ ctx: { user } }) => {
    const balanceDetails = await getCreditBalanceDetails(user.id);

    return {
      balance: balanceDetails.balance,
      earned: balanceDetails.earned,
      spent: balanceDetails.spent,
    };
  },
);

/**
 * Action pour récupérer l'historique des transactions de credits
 */
export const getCreditsHistoryAction = authAction.action(
  async ({ ctx: { user } }) => {
    const history = await getRewardsHistory(user.id, 100); // Dernières 100 transactions

    return {
      transactions: history.map((credit) => ({
        id: credit.id,
        amount: credit.amount,
        type: credit.type,
        reason: credit.reason,
        createdAt: credit.createdAt,
      })),
    };
  },
);

/**
 * Action pour dépenser des credits et obtenir un reward
 */
export const redeemRewardAction = authAction
  .inputSchema(RedeemRewardSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { rewardId, cost } = parsedInput;

    logger.info("Redeeming reward", { userId: user.id, rewardId, cost });

    // 1. Vérifier le solde
    const currentBalance = await getCreditBalance(user.id);

    if (currentBalance < cost) {
      throw new ActionError(
        `Insufficient credits. You have ${currentBalance} credits but need ${cost} credits.`,
      );
    }

    // 2. Traiter le reward selon son type
    let rewardDetails = "";

    switch (rewardId) {
      case "pro_month": {
        // Activer 1 mois Pro
        const result = await activateSubscription({
          userId: user.id,
          plan: "pro",
          daysGranted: 30,
          source: "admin", // Source "credits_redemption" serait mieux mais pas dans le type
        });

        if (!result.success) {
          throw new ActionError(
            result.error ?? "Failed to activate Pro subscription",
          );
        }

        rewardDetails = "1 Month Pro Plan activated";
        break;
      }

      case "ultra_month": {
        // Activer 1 mois Ultra
        const result = await activateSubscription({
          userId: user.id,
          plan: "ultra",
          daysGranted: 30,
          source: "admin",
        });

        if (!result.success) {
          throw new ActionError(
            result.error ?? "Failed to activate Ultra subscription",
          );
        }

        rewardDetails = "1 Month Ultra Plan activated";
        break;
      }

      case "analytics":
      case "custom_badge":
      case "featured":
      case "profile_boost": {
        // Pour l'instant, ces features ne sont pas implémentées
        // On va quand même déduire les credits et log la redemption
        rewardDetails = `${rewardId} reward redeemed (feature coming soon)`;
        logger.warn("Feature reward redeemed but not yet implemented", {
          userId: user.id,
          rewardId,
        });
        break;
      }

      default:
        throw new ActionError(`Unknown reward: ${rewardId}`);
    }

    // 3. Déduire les credits
    const creditType =
      rewardId === "pro_month"
        ? "SPENT_PRO_MONTH"
        : rewardId === "ultra_month"
          ? "SPENT_ULTRA_MONTH"
          : rewardId === "featured"
            ? "SPENT_FEATURED"
            : rewardId === "analytics"
              ? "SPENT_ANALYTICS"
              : rewardId === "profile_boost"
                ? "SPENT_PROFILE_BOOST"
                : "SPENT_CUSTOM_BADGE";

    const spendResult = await spendCredits({
      traderId: user.id,
      amount: cost,
      type: creditType,
      reason: `Redeemed ${rewardId}`,
      metadata: {
        rewardId,
        redeemedAt: new Date().toISOString(),
      },
    });

    if (!spendResult.success) {
      throw new ActionError(spendResult.error ?? "Failed to deduct credits");
    }

    logger.info("✅ Reward redeemed successfully", {
      userId: user.id,
      rewardId,
      cost,
      newBalance: spendResult.newBalance,
    });

    return {
      success: true,
      message: `${rewardDetails}! You now have ${spendResult.newBalance} credits.`,
      newBalance: spendResult.newBalance,
    };
  });
