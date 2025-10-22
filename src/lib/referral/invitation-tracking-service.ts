import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { awardCredits } from "./referral-service";
import type { InvitationSource } from "@/generated/prisma";

/**
 * Invitation Tracking Service
 *
 * Module centralisé pour tracker les invitations et distribuer les credits
 *
 * Responsabilités:
 * - Track l'acceptation d'une invitation (update TraderInvitation fields)
 * - Donner le welcome bonus au trader (+5 credits EARNED_SIGNUP)
 * - Check si un user est actif depuis 30+ jours (pour bonus +10 credits)
 *
 * Architecture:
 * - Appelé depuis acceptInvitationByTokenAction après follow
 * - Utilise ReferralService pour award credits
 * - Utilisé par cron job pour détecter users actifs 30+ jours
 */

type TrackAcceptanceParams = {
  invitationId: string;
  inviteeId: string; // User qui accepte l'invitation
  source?: InvitationSource; // Source de l'invitation (EMAIL par défaut)
};

type TrackAcceptanceResult = {
  success: boolean;
  creditsAwarded?: number;
  error?: string;
};

/**
 * Tracker l'acceptation d'une invitation
 *
 * Appelé quand un user accepte une invitation et commence à suivre le trader
 *
 * Actions:
 * 1. Update TraderInvitation (status ACCEPTED, acceptedAt, clickedAt si pas déjà set)
 * 2. Award welcome bonus au trader (+5 credits EARNED_SIGNUP)
 * 3. Store inviteeId dans metadata pour tracking futur
 *
 * @param params - Paramètres de tracking
 * @returns TrackAcceptanceResult avec succès/erreur
 */
export async function trackInvitationAcceptance(
  params: TrackAcceptanceParams,
): Promise<TrackAcceptanceResult> {
  const { invitationId, inviteeId, source = "EMAIL" } = params;

  logger.info("Tracking invitation acceptance", {
    invitationId,
    inviteeId,
    source,
  });

  try {
    // 1. Récupérer l'invitation
    const invitation = await prisma.traderInvitation.findUnique({
      where: { id: invitationId },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            traderProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      logger.error("Invitation not found", { invitationId });
      return {
        success: false,
        error: "Invitation not found",
      };
    }

    const traderId = invitation.traderId;
    const traderName =
      invitation.trader.traderProfile?.displayName ?? invitation.trader.name;

    // 2. Update TraderInvitation avec tracking info
    const now = new Date();
    await prisma.traderInvitation.update({
      where: { id: invitationId },
      data: {
        status: "ACCEPTED",
        acceptedAt: now,
        clickedAt: invitation.clickedAt ?? now, // Set si pas déjà set
        source,
      },
    });

    logger.info("Invitation updated", { invitationId, traderId });

    // 3. Award welcome bonus au trader (+5 credits EARNED_SIGNUP)
    const bonusAmount = 5;
    const creditsResult = await awardCredits({
      traderId,
      amount: bonusAmount,
      type: "EARNED_SIGNUP",
      reason: `Welcome bonus for inviting ${invitation.email}`,
      metadata: {
        inviteeId,
        inviteeEmail: invitation.email,
        source,
      },
      invitationId, // Lier les credits à cette invitation
    });

    if (!creditsResult.success) {
      logger.error("Failed to award welcome bonus", {
        traderId,
        invitationId,
        error: creditsResult.error,
      });
      // Ne pas fail tout le tracking si credits fail
    }

    logger.info("✅ Invitation acceptance tracked", {
      invitationId,
      traderId,
      traderName,
      creditsAwarded: bonusAmount,
      newBalance: creditsResult.newBalance,
    });

    return {
      success: true,
      creditsAwarded: bonusAmount,
    };
  } catch (error) {
    logger.error("Error tracking invitation acceptance", {
      invitationId,
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Vérifier si un user invité est actif depuis 30+ jours
 *
 * Définition "actif":
 * - Créé il y a 30+ jours
 * - S'est connecté dans les 7 derniers jours
 *
 * Cette fonction sera appelée par le cron job quotidien
 *
 * @param userId - User ID de l'invité
 * @returns true si actif, false sinon
 */
export async function checkUserIsActive30Days(
  userId: string,
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        sessions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn("User not found for activity check", { userId });
      return false;
    }

    // Vérifier 30+ jours depuis création
    const daysSinceCreation = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceCreation < 30) {
      return false;
    }

    // Vérifier dernière session dans les 7 derniers jours
    if (user.sessions.length === 0) {
      return false;
    }

    const lastSession = user.sessions[0];
    const daysSinceLastSession = Math.floor(
      (Date.now() - lastSession.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const isActive = daysSinceLastSession <= 7;

    logger.info("User activity check", {
      userId,
      daysSinceCreation,
      daysSinceLastSession,
      isActive,
    });

    return isActive;
  } catch (error) {
    logger.error("Error checking user activity", { userId, error });
    return false;
  }
}

/**
 * Award le bonus "active 30 days" au trader
 *
 * Appelé par le cron job quand on détecte qu'un invité est actif 30+ jours
 *
 * Actions:
 * 1. Update TraderInvitation.inviteeActive = true
 * 2. Award +10 credits EARNED_ACTIVE au trader
 *
 * @param invitationId - Invitation ID
 * @param inviteeId - User ID de l'invité actif
 * @returns TrackAcceptanceResult
 */
export async function awardActiveBonus(
  invitationId: string,
  inviteeId: string,
): Promise<TrackAcceptanceResult> {
  logger.info("Awarding active bonus", { invitationId, inviteeId });

  try {
    // 1. Récupérer l'invitation
    const invitation = await prisma.traderInvitation.findUnique({
      where: { id: invitationId },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      logger.error("Invitation not found", { invitationId });
      return {
        success: false,
        error: "Invitation not found",
      };
    }

    // Vérifier que le bonus n'a pas déjà été donné
    if (invitation.inviteeActive) {
      logger.warn("Active bonus already awarded", {
        invitationId,
        traderId: invitation.traderId,
      });
      return {
        success: false,
        error: "Active bonus already awarded for this invitation",
      };
    }

    const traderId = invitation.traderId;

    // 2. Update TraderInvitation.inviteeActive = true
    await prisma.traderInvitation.update({
      where: { id: invitationId },
      data: {
        inviteeActive: true,
      },
    });

    // 3. Award +10 credits EARNED_ACTIVE
    const bonusAmount = 10;
    const creditsResult = await awardCredits({
      traderId,
      amount: bonusAmount,
      type: "EARNED_ACTIVE",
      reason: `Active bonus for ${invitation.email} (30+ days active)`,
      metadata: {
        inviteeId,
        inviteeEmail: invitation.email,
      },
      invitationId,
    });

    if (!creditsResult.success) {
      logger.error("Failed to award active bonus", {
        traderId,
        invitationId,
        error: creditsResult.error,
      });
      return {
        success: false,
        error: creditsResult.error,
      };
    }

    logger.info("✅ Active bonus awarded", {
      invitationId,
      traderId,
      creditsAwarded: bonusAmount,
      newBalance: creditsResult.newBalance,
    });

    return {
      success: true,
      creditsAwarded: bonusAmount,
    };
  } catch (error) {
    logger.error("Error awarding active bonus", { invitationId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Track une visite sur la landing page d'invitation (avant acceptation)
 *
 * Increment landingViews et set clickedAt si première visite
 *
 * @param token - Token d'invitation
 * @returns boolean success
 */
export async function trackInvitationView(token: string): Promise<boolean> {
  logger.info("Tracking invitation view", { token });

  try {
    const invitation = await prisma.traderInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        clickedAt: true,
        landingViews: true,
      },
    });

    if (!invitation) {
      logger.warn("Invitation not found for view tracking", { token });
      return false;
    }

    const isFirstView = !invitation.clickedAt;
    const now = new Date();

    await prisma.traderInvitation.update({
      where: { id: invitation.id },
      data: {
        landingViews: {
          increment: 1,
        },
        ...(isFirstView && { clickedAt: now }),
      },
    });

    logger.info("Invitation view tracked", {
      invitationId: invitation.id,
      landingViews: invitation.landingViews + 1,
      isFirstView,
    });

    return true;
  } catch (error) {
    logger.error("Error tracking invitation view", { token, error });
    return false;
  }
}

/**
 * Award le bonus upgrade au trader
 *
 * Appelé depuis subscription-manager.ts quand un invité upgrade vers Pro/Ultra
 *
 * Actions:
 * 1. Trouver l'invitation de cet invité (via email ou userId)
 * 2. Update TraderInvitation.inviteeUpgraded = true, inviteeUpgradedPlan, inviteeUpgradedAt
 * 3. Award +50 credits (Pro) ou +100 credits (Ultra) EARNED_UPGRADE_*
 *
 * @param inviteeId - User ID de l'invité qui upgrade
 * @param plan - Plan vers lequel il upgrade ("pro" ou "ultra")
 * @returns TrackAcceptanceResult
 */
export async function awardUpgradeBonus(
  inviteeId: string,
  plan: "pro" | "ultra",
): Promise<TrackAcceptanceResult> {
  logger.info("Awarding upgrade bonus", { inviteeId, plan });

  try {
    // 1. Trouver l'invitation qui a amené cet invité
    // On cherche un Follow avec source INVITATION pour cet invité
    const follow = await prisma.follow.findFirst({
      where: {
        userId: inviteeId,
        source: "INVITATION",
      },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // La plus récente si plusieurs
      },
    });

    if (!follow) {
      logger.warn("No invitation-based follow found for invitee", {
        inviteeId,
      });
      return {
        success: false,
        error: "No invitation found for this user",
      };
    }

    const traderId = follow.traderId;

    // 2. Trouver l'invitation correspondante
    const inviteeUser = await prisma.user.findUnique({
      where: { id: inviteeId },
      select: { email: true },
    });

    if (!inviteeUser) {
      logger.error("Invitee user not found", { inviteeId });
      return {
        success: false,
        error: "Invitee user not found",
      };
    }

    const invitation = await prisma.traderInvitation.findFirst({
      where: {
        traderId,
        email: inviteeUser.email,
        status: "ACCEPTED",
      },
    });

    if (!invitation) {
      logger.warn("Accepted invitation not found", {
        traderId,
        inviteeEmail: inviteeUser.email,
      });
      return {
        success: false,
        error: "Accepted invitation not found",
      };
    }

    // Vérifier que le bonus n'a pas déjà été donné
    if (invitation.inviteeUpgraded) {
      logger.warn("Upgrade bonus already awarded", {
        invitationId: invitation.id,
        traderId,
      });
      return {
        success: false,
        error: "Upgrade bonus already awarded for this invitation",
      };
    }

    // 3. Update TraderInvitation
    const now = new Date();
    await prisma.traderInvitation.update({
      where: { id: invitation.id },
      data: {
        inviteeUpgraded: true,
        inviteeUpgradedPlan: plan,
        inviteeUpgradedAt: now,
      },
    });

    // 4. Award credits selon le plan
    const bonusAmount = plan === "pro" ? 50 : 100;
    const creditType =
      plan === "pro" ? "EARNED_UPGRADE_PRO" : "EARNED_UPGRADE_ULTRA";

    const creditsResult = await awardCredits({
      traderId,
      amount: bonusAmount,
      type: creditType,
      reason: `Upgrade bonus for ${invitation.email} (${plan.toUpperCase()})`,
      metadata: {
        inviteeId,
        inviteeEmail: invitation.email,
        plan,
      },
      invitationId: invitation.id,
    });

    if (!creditsResult.success) {
      logger.error("Failed to award upgrade bonus", {
        traderId,
        invitationId: invitation.id,
        error: creditsResult.error,
      });
      return {
        success: false,
        error: creditsResult.error,
      };
    }

    logger.info("✅ Upgrade bonus awarded", {
      invitationId: invitation.id,
      traderId,
      plan,
      creditsAwarded: bonusAmount,
      newBalance: creditsResult.newBalance,
    });

    return {
      success: true,
      creditsAwarded: bonusAmount,
    };
  } catch (error) {
    logger.error("Error awarding upgrade bonus", { inviteeId, plan, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
