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
export const hasActiveInvitation = async (
  traderId: string,
  email: string,
) => {
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
