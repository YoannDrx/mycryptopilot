"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { getPlanLimits } from "@/lib/crypto/mycryptopilot-plans";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { prisma } from "@/lib/prisma";
import {
  countFollowedTraders,
  getFollow,
  getUserWithPlan,
  isFollowingTrader,
} from "./follow-queries";
import { FollowTraderSchema, UnfollowTraderSchema } from "./follow.schema";

/**
 * Helper pour récupérer le plan d'un user
 */
const getUserPlan = async (userId: string): Promise<MyCryptoPilotPlanName> => {
  const user = await getUserWithPlan(userId);

  if (!user) {
    throw new ActionError("User not found");
  }

  // Return user's actual plan, default to "free" if not set
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- planName is nullable in DB
  return (user.planName as MyCryptoPilotPlanName) ?? "free";
};

/**
 * Vérifie si un user peut suivre un nouveau trader en fonction de son plan
 */
const canFollowTrader = async (userId: string): Promise<boolean> => {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const currentFollowCount = await countFollowedTraders(userId);

  // tradersFollow = 999 signifie illimité (plan ultra)
  if (limits.tradersFollow >= 999) {
    return true;
  }

  return currentFollowCount < limits.tradersFollow;
};

/**
 * Action pour suivre un trader
 *
 * Vérifie:
 * - Que le trader existe et a un profil trader
 * - Que le user ne suit pas déjà ce trader
 * - Que le user n'a pas atteint sa limite de traders suivis (selon son plan)
 */
export const followTraderAction = authAction
  .inputSchema(FollowTraderSchema)
  .action(async ({ parsedInput: { traderId }, ctx: { user } }) => {
    // Vérifier qu'on ne suit pas soi-même
    if (user.id === traderId) {
      throw new ActionError("You cannot follow yourself");
    }

    // Vérifier que le trader existe et a un profil trader
    const trader = await prisma.user.findUnique({
      where: { id: traderId },
      include: {
        traderProfile: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!trader) {
      throw new ActionError("Trader not found");
    }

    if (!trader.traderProfile) {
      throw new ActionError("This user is not a trader");
    }

    // Vérifier qu'on ne suit pas déjà ce trader
    const alreadyFollowing = await isFollowingTrader(user.id, traderId);

    if (alreadyFollowing) {
      throw new ActionError("You are already following this trader");
    }

    // Vérifier les limites du plan
    const canFollow = await canFollowTrader(user.id);

    if (!canFollow) {
      const plan = await getUserPlan(user.id);
      const limits = getPlanLimits(plan);

      throw new ActionError(
        `You have reached your plan limit of ${limits.tradersFollow} trader(s). Upgrade your plan to follow more traders.`,
      );
    }

    // Créer le follow
    const follow = await prisma.follow.create({
      data: {
        userId: user.id,
        traderId,
        status: "ACTIVE",
        startedAt: new Date(),
      },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            image: true,
            traderProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    return {
      follow,
      message: `You are now following ${trader.traderProfile.displayName}`,
    };
  });

/**
 * Action pour ne plus suivre un trader
 *
 * Vérifie que le follow existe et met à jour le status à CANCELLED
 * (soft delete pour garder l'historique)
 */
export const unfollowTraderAction = authAction
  .inputSchema(UnfollowTraderSchema)
  .action(async ({ parsedInput: { traderId }, ctx: { user } }) => {
    // Vérifier que le follow existe
    const follow = await getFollow(user.id, traderId);

    if (!follow) {
      throw new ActionError("You are not following this trader");
    }

    if (follow.status !== "ACTIVE") {
      throw new ActionError("This follow is not active");
    }

    // Mettre à jour le status à CANCELLED (soft delete)
    await prisma.follow.update({
      where: {
        id: follow.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      message: "You have unfollowed this trader",
    };
  });
