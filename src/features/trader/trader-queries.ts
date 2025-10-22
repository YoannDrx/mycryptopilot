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

/**
 * Récupère un trader (user + traderProfile) par son userId
 * Utilisé pour les pages publiques (/follow/[traderId], /traders/[traderId])
 */
export const getTraderById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      traderProfile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          verified: true,
          verifiedAt: true,
          statsJson: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
};

/**
 * Recherche et filtre des traders pour la marketplace
 */
export const searchTraders = async (params?: {
  search?: string;
  verified?: boolean;
  sortBy?: "winrate" | "followers" | "signals" | "recent";
  cursor?: string;
  limit?: number;
}) => {
  const { search, verified, cursor, limit = 12 } = params ?? {};

  // Construire les conditions where
  const where: {
    verified?: boolean;
    OR?: {
      displayName?: { contains: string; mode: "insensitive" };
      bio?: { contains: string; mode: "insensitive" };
    }[];
  } = {};

  if (verified !== undefined) {
    where.verified = verified;
  }

  if (search && search.trim().length > 0) {
    where.OR = [
      {
        displayName: {
          contains: search.trim(),
          mode: "insensitive" as const,
        },
      },
      {
        bio: {
          contains: search.trim(),
          mode: "insensitive" as const,
        },
      },
    ];
  }

  // Définir le tri
  // Note: Trier par JSON (statsJson) ou par relations n'est pas supporté par Prisma
  // Pour le MVP, on trie toujours par date de création
  // En production, il faudrait des colonnes séparées pour winrate, etc.
  const orderBy = { createdAt: "desc" as const };

  const traders = await prisma.traderProfile.findMany({
    where,
    take: limit + 1, // +1 pour savoir s'il y a une page suivante
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy,
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

  // Séparer les résultats et le curseur pour la page suivante
  const hasNextPage = traders.length > limit;
  const items = hasNextPage ? traders.slice(0, -1) : traders;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined;

  return {
    items,
    nextCursor,
    hasNextPage,
  };
};
