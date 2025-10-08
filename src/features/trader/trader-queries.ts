import { prisma } from "@/lib/prisma";

/**
 * Récupère le profil trader d'un utilisateur par son userId
 */
export const getTraderProfileByUserId = async (userId: string) => {
  return prisma.traderProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
};

/**
 * Récupère un profil trader par son ID
 */
export const getTraderProfileById = async (id: string) => {
  return prisma.traderProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
};

/**
 * Vérifie si un utilisateur a déjà un profil trader
 */
export const checkUserHasTraderProfile = async (userId: string) => {
  const profile = await prisma.traderProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return !!profile;
};

/**
 * Récupère l'utilisateur complet avec son profil trader et userRole
 *
 * Cette fonction est nécessaire car getRequiredUser() retourne le type Better Auth
 * qui ne contient pas les champs custom Prisma (userRole, traderProfile, etc.)
 */
export const getUserWithTraderProfile = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      userRole: true,
      traderProfile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          priceMonthlyUSD: true,
          verified: true,
          statsJson: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
};

/**
 * Liste tous les profils traders avec pagination
 */
export const listTraderProfiles = async (params?: {
  cursor?: string;
  limit?: number;
  verified?: boolean;
}) => {
  const { cursor, limit = 20, verified } = params ?? {};

  return prisma.traderProfile.findMany({
    where: verified !== undefined ? { verified } : undefined,
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
};
