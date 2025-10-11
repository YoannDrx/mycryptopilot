import { prisma } from "@/lib/prisma";

/**
 * Get invitation conversion statistics for a trader
 */
export async function getInvitationStats(traderId: string) {
  // Get all invitations counts
  const [totalInvitations, acceptedInvitations, pendingInvitations] =
    await Promise.all([
      prisma.traderInvitation.count({
        where: { traderId },
      }),
      prisma.traderInvitation.count({
        where: { traderId, status: "ACCEPTED" },
      }),
      prisma.traderInvitation.count({
        where: { traderId, status: "PENDING" },
      }),
    ]);

  // Calculate conversion rate
  const conversionRate =
    totalInvitations > 0 ? (acceptedInvitations / totalInvitations) * 100 : 0;

  return {
    total: totalInvitations,
    accepted: acceptedInvitations,
    pending: pendingInvitations,
    conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Get follow source statistics for a trader
 */
export async function getFollowSourceStats(traderId: string) {
  // Get counts by source
  const [directFollows, invitationFollows, referralFollows, totalFollows] =
    await Promise.all([
      prisma.follow.count({
        where: { traderId, source: "DIRECT", status: "ACTIVE" },
      }),
      prisma.follow.count({
        where: { traderId, source: "INVITATION", status: "ACTIVE" },
      }),
      prisma.follow.count({
        where: { traderId, source: "REFERRAL", status: "ACTIVE" },
      }),
      prisma.follow.count({
        where: { traderId, status: "ACTIVE" },
      }),
    ]);

  // Calculate percentages
  const getPercentage = (count: number) =>
    totalFollows > 0 ? Math.round((count / totalFollows) * 100) : 0;

  return {
    total: totalFollows,
    direct: {
      count: directFollows,
      percentage: getPercentage(directFollows),
    },
    invitation: {
      count: invitationFollows,
      percentage: getPercentage(invitationFollows),
    },
    referral: {
      count: referralFollows,
      percentage: getPercentage(referralFollows),
    },
  };
}

/**
 * Get complete conversion stats for trader dashboard
 */
export async function getTraderConversionStats(traderId: string) {
  const [invitationStats, followSourceStats] = await Promise.all([
    getInvitationStats(traderId),
    getFollowSourceStats(traderId),
  ]);

  return {
    invitations: invitationStats,
    follows: followSourceStats,
  };
}
