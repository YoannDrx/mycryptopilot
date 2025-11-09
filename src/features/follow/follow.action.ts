"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { getPlanLimits } from "@/lib/crypto/mycryptopilot-plans";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { prisma } from "@/lib/prisma";
import {
  addFollowerToTraderChannel,
  removeFollowerFromTraderChannel,
} from "@/lib/discord/trader-channels";
import { logger } from "@/lib/logger";
import {
  countFollowedTraders,
  getFollow,
  isFollowingTrader,
} from "./follow-queries";
import { FollowTraderSchema, UnfollowTraderSchema } from "./follow.schema";
import { getUserSubscription } from "@/lib/subscription/get-user-subscription";

/**
 * Helper pour récupérer le plan d'un user (dual-mode via getUserSubscription)
 */
const getUserPlan = async (userId: string): Promise<MyCryptoPilotPlanName> => {
  const subscription = await getUserSubscription(userId);
  return subscription.plan;
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
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { traderId, source = "DIRECT", invitationId } = parsedInput;
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

    // Créer ou réactiver le follow (upsert pour gérer le cas où l'entrée existe avec status CANCELLED)
    const follow = await prisma.follow.upsert({
      where: {
        userId_traderId: {
          userId: user.id,
          traderId,
        },
      },
      update: {
        // Si l'entrée existe (status CANCELLED), on la réactive
        status: "ACTIVE",
        source,
        invitationId,
        startedAt: new Date(),
        expiresAt: null, // Reset expiration
      },
      create: {
        // Si l'entrée n'existe pas, on la crée
        userId: user.id,
        traderId,
        status: "ACTIVE",
        source,
        invitationId,
        startedAt: new Date(),
      },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            image: true,
            discordId: true,
            traderProfile: {
              select: {
                displayName: true,
                verified: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            discordId: true,
          },
        },
      },
    });

    // Ajouter follower au channel Discord trader (Phase 2.3)
    if (process.env.DISCORD_BOT_ENABLED === "true" && follow.user.discordId) {
      try {
        await addFollowerToTraderChannel(traderId, follow.user.discordId);
        logger.info(
          `Discord: Added follower ${user.id} to trader ${traderId} channel`,
        );
      } catch (error) {
        logger.error(
          "Failed to add follower to Discord trader channel:",
          error,
        );
        // Ne pas bloquer si Discord échoue
      }
    }

    // Send Discord notifications (non-blocking)
    const { notifyTraderNewFollower, notifyFollowerWelcome } = await import(
      "@/lib/discord/dm-notifications"
    );

    // Notify trader about new follower
    if (follow.trader.discordId) {
      void notifyTraderNewFollower(
        follow.trader.discordId,
        follow.user.name,
        source,
      );
    }

    // Welcome message to follower
    if (follow.user.discordId) {
      void notifyFollowerWelcome(
        follow.user.discordId,
        follow.trader.traderProfile?.displayName ?? follow.trader.name,
        follow.trader.traderProfile?.verified ?? false,
      );
    }

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

    // Récupérer le discordId du user pour retirer du channel Discord
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { discordId: true },
    });

    // Mettre à jour le status à CANCELLED (soft delete)
    await prisma.follow.update({
      where: {
        id: follow.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Retirer follower du channel Discord trader (Phase 2.3)
    if (process.env.DISCORD_BOT_ENABLED === "true" && fullUser?.discordId) {
      try {
        await removeFollowerFromTraderChannel(traderId, fullUser.discordId);
        logger.info(
          `Discord: Removed follower ${user.id} from trader ${traderId} channel`,
        );
      } catch (error) {
        logger.error(
          "Failed to remove follower from Discord trader channel:",
          error,
        );
        // Ne pas bloquer si Discord échoue
      }
    }

    return {
      message: "You have unfollowed this trader",
    };
  });
