import { prisma } from "@/lib/prisma";

/**
 * Get all invitations sent by a trader
 *
 * @param traderId - Trader user ID
 * @param includeExpired - Whether to include expired invitations (default: true)
 * @returns Array of invitations with status
 */
export const getTraderInvitations = async (
  traderId: string,
  includeExpired = true,
) => {
  const where = includeExpired
    ? { traderId }
    : {
        traderId,
        status: {
          not: "EXPIRED" as const,
        },
      };

  return prisma.traderInvitation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get invitation by token
 *
 * Only returns valid (non-expired) invitations
 *
 * @param token - Invitation token
 * @returns Invitation with trader info or null
 */
export const getInvitationByToken = async (token: string) => {
  const invitation = await prisma.traderInvitation.findUnique({
    where: { token },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          image: true,
          traderProfile: {
            select: {
              displayName: true,
              bio: true,
              verified: true,
              statsJson: true,
            },
          },
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  // Check if expired
  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await prisma.traderInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  // Check if already accepted
  if (invitation.status === "ACCEPTED") {
    return null;
  }

  return invitation;
};

/**
 * Check if an email has already been invited by a trader
 *
 * @param traderId - Trader user ID
 * @param email - Email to check
 * @returns True if invitation exists and is pending
 */
export const hasActiveInvitation = async (traderId: string, email: string) => {
  const invitation = await prisma.traderInvitation.findUnique({
    where: {
      traderId_email: {
        traderId,
        email: email.toLowerCase(),
      },
    },
  });

  if (!invitation) {
    return false;
  }

  // Check if expired
  if (new Date() > invitation.expiresAt) {
    return false;
  }

  // Check if already accepted
  if (invitation.status === "ACCEPTED") {
    return false;
  }

  return true;
};

/**
 * Get invitation statistics for a trader
 *
 * @param traderId - Trader user ID
 * @returns Stats object with counts
 */
export const getInvitationStats = async (traderId: string) => {
  const [total, pending, accepted] = await Promise.all([
    prisma.traderInvitation.count({
      where: { traderId },
    }),
    prisma.traderInvitation.count({
      where: { traderId, status: "PENDING" },
    }),
    prisma.traderInvitation.count({
      where: { traderId, status: "ACCEPTED" },
    }),
  ]);

  const conversionRate = total > 0 ? (accepted / total) * 100 : 0;

  return {
    total,
    pending,
    accepted,
    expired: total - pending - accepted,
    conversionRate: Math.round(conversionRate * 10) / 10, // 1 decimal
  };
};

/**
 * Get detailed funnel statistics for trader dashboard
 *
 * Calculates: Sent → Clicked → Signed → Active 30d → Upgraded
 *
 * @param traderId - Trader user ID
 * @returns Detailed funnel stats with drop-off %
 */
export const getDetailedFunnelStats = async (traderId: string) => {
  const invitations = await prisma.traderInvitation.findMany({
    where: { traderId },
    select: {
      status: true,
      landingViews: true,
      inviteeActive: true,
      inviteeUpgraded: true,
    },
  });

  const total = invitations.length;
  const clicked = invitations.filter((inv) => inv.landingViews > 0).length;
  const signed = invitations.filter((inv) => inv.status === "ACCEPTED").length;
  const active = invitations.filter((inv) => inv.inviteeActive).length;
  const upgraded = invitations.filter((inv) => inv.inviteeUpgraded).length;

  const getPercentage = (count: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;
  const getConversionRate = (from: number, to: number) =>
    from > 0 ? Math.round((to / from) * 100) : 0;

  return {
    sent: {
      count: total,
      percentage: 100,
    },
    clicked: {
      count: clicked,
      percentage: getPercentage(clicked),
      conversionRate: getConversionRate(total, clicked),
    },
    signed: {
      count: signed,
      percentage: getPercentage(signed),
      conversionRate: getConversionRate(clicked, signed),
    },
    active: {
      count: active,
      percentage: getPercentage(active),
      conversionRate: getConversionRate(signed, active),
    },
    upgraded: {
      count: upgraded,
      percentage: getPercentage(upgraded),
      conversionRate: getConversionRate(active, upgraded),
    },
  };
};

/**
 * Get referral earnings statistics for trader
 *
 * Calculates:
 * - Total credits earned from referrals
 * - Revenue from upgraded invitees
 * - Potential revenue from active non-upgraded invitees
 *
 * @param traderId - Trader user ID
 * @returns Earnings stats
 */
export const getReferralEarnings = async (traderId: string) => {
  // Get total credits from ReferralCredit
  const creditsResult = await prisma.referralCredit.aggregate({
    where: {
      traderId,
      amount: { gt: 0 }, // Only earned credits
    },
    _sum: {
      amount: true,
    },
  });

  const totalCreditsEarned = creditsResult._sum.amount ?? 0;

  // Get upgraded invitees with plan info
  const upgradedInvitees = await prisma.traderInvitation.findMany({
    where: {
      traderId,
      inviteeUpgraded: true,
      inviteeUpgradedPlan: { not: null },
    },
    select: {
      inviteeUpgradedPlan: true,
    },
  });

  // Calculate monthly revenue from upgraded invitees
  const proCount = upgradedInvitees.filter(
    (inv) => inv.inviteeUpgradedPlan === "pro",
  ).length;
  const ultraCount = upgradedInvitees.filter(
    (inv) => inv.inviteeUpgradedPlan === "ultra",
  ).length;
  const monthlyRevenue = proCount * 49 + ultraCount * 99;

  // Get active non-upgraded invitees (potential)
  const activeNotUpgraded = await prisma.traderInvitation.count({
    where: {
      traderId,
      inviteeActive: true,
      inviteeUpgraded: false,
    },
  });

  // Potential revenue (assume 50% would upgrade Pro, 50% Ultra)
  const potentialProCount = Math.ceil(activeNotUpgraded / 2);
  const potentialUltraCount = Math.floor(activeNotUpgraded / 2);
  const potentialRevenue = potentialProCount * 49 + potentialUltraCount * 99;

  // Credits value in $ (1 credit ≈ 0.5$ based on rewards catalog)
  const creditsValueUsd = Math.round(totalCreditsEarned * 0.5);

  return {
    totalCreditsEarned,
    creditsValueUsd,
    monthlyRevenue,
    potentialRevenue,
    upgradedCount: upgradedInvitees.length,
    activeNotUpgradedCount: activeNotUpgraded,
    breakdown: {
      pro: proCount,
      ultra: ultraCount,
    },
  };
};

/**
 * Get top invitees by credits earned (leaderboard)
 *
 * @param traderId - Trader user ID
 * @param limit - Number of top invitees to return (default: 5)
 * @returns Array of top invitees
 */
export const getTopInvitees = async (traderId: string, limit = 5) => {
  const invitations = await prisma.traderInvitation.findMany({
    where: {
      traderId,
      status: "ACCEPTED",
    },
    orderBy: {
      creditsAwarded: "desc",
    },
    take: limit,
    select: {
      id: true,
      email: true,
      creditsAwarded: true,
      inviteeActive: true,
      inviteeUpgraded: true,
      inviteeUpgradedPlan: true,
      acceptedAt: true,
    },
  });

  return invitations.map((inv) => {
    // Calculate days since signup
    const daysSinceSignup = inv.acceptedAt
      ? Math.floor(
          (Date.now() - inv.acceptedAt.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      id: inv.id,
      email: inv.email,
      creditsEarned: inv.creditsAwarded,
      isActive: inv.inviteeActive,
      isUpgraded: inv.inviteeUpgraded,
      plan: inv.inviteeUpgradedPlan,
      daysSinceSignup,
    };
  });
};
