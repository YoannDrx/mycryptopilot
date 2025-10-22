import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Rate Limiter Service
 *
 * Limite le nombre d'invitations qu'un trader peut envoyer dans un délai donné
 *
 * Limites:
 * - 10 invitations par heure
 * - 50 invitations par jour
 * - 200 invitations par semaine
 */

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  current: number;
  resetAt: Date;
  reason?: string;
};

/**
 * Check if trader has exceeded invitation rate limits
 *
 * @param traderId - Trader user ID
 * @returns Rate limit status and details
 */
export async function checkInvitationRateLimit(
  traderId: string,
): Promise<RateLimitResult> {
  const now = new Date();

  // Check hourly limit (10 invitations)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const hourlyCount = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (hourlyCount >= 10) {
    const resetAt = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);
    logger.warn("⚠️ Hourly rate limit exceeded", {
      traderId,
      count: hourlyCount,
      limit: 10,
    });

    return {
      allowed: false,
      limit: 10,
      current: hourlyCount,
      resetAt,
      reason: "Hourly limit exceeded (10 invitations per hour)",
    };
  }

  // Check daily limit (50 invitations)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dailyCount = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: oneDayAgo },
    },
  });

  if (dailyCount >= 50) {
    const resetAt = new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000);
    logger.warn("⚠️ Daily rate limit exceeded", {
      traderId,
      count: dailyCount,
      limit: 50,
    });

    return {
      allowed: false,
      limit: 50,
      current: dailyCount,
      resetAt,
      reason: "Daily limit exceeded (50 invitations per day)",
    };
  }

  // Check weekly limit (200 invitations)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCount = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: oneWeekAgo },
    },
  });

  if (weeklyCount >= 200) {
    const resetAt = new Date(oneWeekAgo.getTime() + 7 * 24 * 60 * 60 * 1000);
    logger.warn("⚠️ Weekly rate limit exceeded", {
      traderId,
      count: weeklyCount,
      limit: 200,
    });

    return {
      allowed: false,
      limit: 200,
      current: weeklyCount,
      resetAt,
      reason: "Weekly limit exceeded (200 invitations per week)",
    };
  }

  // All limits OK
  return {
    allowed: true,
    limit: 10, // Show hourly limit
    current: hourlyCount,
    resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000),
  };
}

/**
 * Get current rate limit status for a trader (for UI display)
 */
export async function getRateLimitStatus(traderId: string): Promise<{
  hourly: { count: number; limit: number; remaining: number };
  daily: { count: number; limit: number; remaining: number };
  weekly: { count: number; limit: number; remaining: number };
}> {
  const now = new Date();

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [hourlyCount, dailyCount, weeklyCount] = await Promise.all([
    prisma.traderInvitation.count({
      where: { traderId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.traderInvitation.count({
      where: { traderId, createdAt: { gte: oneDayAgo } },
    }),
    prisma.traderInvitation.count({
      where: { traderId, createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  return {
    hourly: {
      count: hourlyCount,
      limit: 10,
      remaining: Math.max(0, 10 - hourlyCount),
    },
    daily: {
      count: dailyCount,
      limit: 50,
      remaining: Math.max(0, 50 - dailyCount),
    },
    weekly: {
      count: weeklyCount,
      limit: 200,
      remaining: Math.max(0, 200 - weeklyCount),
    },
  };
}
