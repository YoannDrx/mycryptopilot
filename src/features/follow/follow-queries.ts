import { prisma } from "@/lib/prisma";

/**
 * Vérifie si un user suit déjà un trader
 */
export const isFollowingTrader = async (
  userId: string,
  traderId: string,
): Promise<boolean> => {
  const follow = await prisma.follow.findUnique({
    where: {
      userId_traderId: {
        userId,
        traderId,
      },
    },
    select: { id: true, status: true },
  });

  return !!follow && follow.status === "ACTIVE";
};

/**
 * Récupère le follow entre un user et un trader (si existe)
 */
export const getFollow = async (userId: string, traderId: string) => {
  return prisma.follow.findUnique({
    where: {
      userId_traderId: {
        userId,
        traderId,
      },
    },
  });
};

/**
 * Compte le nombre de traders suivis par un user (status ACTIVE)
 */
export const countFollowedTraders = async (userId: string): Promise<number> => {
  return prisma.follow.count({
    where: {
      userId,
      status: "ACTIVE",
    },
  });
};

/**
 * Compte le nombre de followers d'un trader (status ACTIVE)
 */
export const countTraderFollowers = async (
  traderId: string,
): Promise<number> => {
  return prisma.follow.count({
    where: {
      traderId,
      status: "ACTIVE",
    },
  });
};

/**
 * Liste les traders suivis par un user
 */
export const getFollowedTraders = async (userId: string) => {
  return prisma.follow.findMany({
    where: {
      userId,
      status: "ACTIVE",
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
              bio: true,
              verified: true,
              priceMonthlyUSD: true,
              statsJson: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Liste les followers d'un trader
 */
export const getTraderFollowers = async (traderId: string) => {
  return prisma.follow.findMany({
    where: {
      traderId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Récupère un user avec son rôle
 * Note: Le système de plans (planName, planExpiresAt) n'est pas encore implémenté en DB
 * Pour l'instant, on assume que tous les users sont en plan "free"
 */
export const getUserWithPlan = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userRole: true,
    },
  });
};
