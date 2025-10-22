import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Trial Service
 *
 * Gère l'activation des trials gratuits via le système de referral
 */

/**
 * Activate 14-day Pro trial for a user who signed up via referral invitation
 *
 * @param userId - User ID to grant trial to
 * @param referralCode - Referral/invitation token used during signup
 * @returns Success status and trial details
 */
export async function activateReferralTrial(
  userId: string,
  referralCode: string,
): Promise<{
  success: boolean;
  trialEndsAt?: Date;
  error?: string;
}> {
  try {
    // Verify the referral code is valid
    const invitation = await prisma.traderInvitation.findUnique({
      where: { token: referralCode },
      select: {
        id: true,
        traderId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation) {
      return { success: false, error: "Invalid referral code" };
    }

    if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
      return { success: false, error: "Referral code expired" };
    }

    // Grant 14-day Pro trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.user.update({
      where: { id: userId },
      data: {
        trialEndsAt,
        trialPlan: "pro",
      },
    });

    logger.info("✅ Activated 14-day Pro trial", {
      userId,
      referralCode,
      traderId: invitation.traderId,
      trialEndsAt,
    });

    return {
      success: true,
      trialEndsAt,
    };
  } catch (error) {
    logger.error("❌ Failed to activate referral trial", {
      userId,
      referralCode,
      error,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if user has an active trial
 *
 * @param userId - User ID to check
 * @returns Trial status and remaining days
 */
export async function getUserTrialStatus(userId: string): Promise<{
  hasTrial: boolean;
  trialPlan?: string;
  trialEndsAt?: Date;
  daysRemaining?: number;
  isExpired: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialEndsAt: true,
      trialPlan: true,
    },
  });

  if (!user?.trialEndsAt || !user.trialPlan) {
    return { hasTrial: false, isExpired: false };
  }

  const now = new Date();
  const isExpired = now > user.trialEndsAt;

  if (isExpired) {
    // Clear expired trial
    await prisma.user.update({
      where: { id: userId },
      data: {
        trialEndsAt: null,
        trialPlan: null,
      },
    });

    return { hasTrial: false, isExpired: true };
  }

  const daysRemaining = Math.ceil(
    (user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    hasTrial: true,
    trialPlan: user.trialPlan,
    trialEndsAt: user.trialEndsAt,
    daysRemaining,
    isExpired: false,
  };
}

/**
 * Get effective user plan (considering trial)
 *
 * Returns the active plan, taking into account:
 * - Active trial (takes priority)
 * - Regular paid plan
 * - Free plan (default)
 *
 * @param userId - User ID
 * @returns Effective plan name
 */
export async function getEffectiveUserPlan(
  userId: string,
): Promise<"free" | "pro" | "ultra"> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planName: true,
      planExpiresAt: true,
      trialEndsAt: true,
      trialPlan: true,
    },
  });

  if (!user) {
    return "free";
  }

  // Check trial first (takes priority)
  if (user.trialEndsAt && user.trialPlan) {
    const now = new Date();
    if (now <= user.trialEndsAt) {
      return user.trialPlan as "pro" | "ultra";
    }
  }

  // Check regular plan
  if (user.planName && user.planName !== "free") {
    if (!user.planExpiresAt || new Date() <= user.planExpiresAt) {
      return user.planName as "pro" | "ultra";
    }
  }

  return "free";
}
