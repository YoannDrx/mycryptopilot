import { prisma } from "@/lib/prisma";

/**
 * Récupère un signal par son ID
 */
export const getSignalById = async (id: string) => {
  return prisma.signal.findUnique({
    where: { id },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          image: true,
          traderProfile: {
            select: {
              displayName: true,
              verified: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Liste les signaux avec filtres et pagination
 */
export const listSignals = async (params?: {
  traderId?: string;
  symbol?: string;
  bias?: "LONG" | "SHORT";
  status?: "ACTIVE" | "EXPIRED";
  cursor?: string;
  limit?: number;
  includeExpired?: boolean;
}) => {
  const {
    traderId,
    symbol,
    bias,
    status,
    cursor,
    limit = 20,
    includeExpired = false,
  } = params ?? {};

  // Construire les conditions where
  const where: {
    traderId?: string;
    symbol?: string;
    expiresAt?: { gt: Date } | { lte: Date };
    AND?: {
      payloadJson?: {
        path: string[];
        equals: string;
      };
    }[];
  } = {};

  if (traderId) {
    where.traderId = traderId;
  }

  if (symbol) {
    where.symbol = symbol;
  }

  // Filter by status
  if (status === "ACTIVE" || !includeExpired) {
    where.expiresAt = {
      gt: new Date(),
    };
  } else if (status === "EXPIRED") {
    where.expiresAt = {
      lte: new Date(),
    };
  }

  // Filter by bias (LONG/SHORT) in JSON payload
  if (bias) {
    where.AND = [
      {
        payloadJson: {
          path: ["bias"],
          equals: bias,
        },
      },
    ];
  }

  return prisma.signal.findMany({
    where,
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          image: true,
          traderProfile: {
            select: {
              displayName: true,
              verified: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Récupère les signaux d'un trader spécifique
 */
export const getSignalsByTraderId = async (
  traderId: string,
  options?: {
    limit?: number;
    cursor?: string;
    includeExpired?: boolean;
  },
) => {
  return listSignals({
    traderId,
    ...options,
  });
};

/**
 * Récupère les signaux pour les traders suivis par un user
 *
 * Utilisé dans le feed du dashboard user
 */
export const getSignalsFromFollowedTraders = async (
  userId: string,
  options?: {
    limit?: number;
    cursor?: string;
    includeExpired?: boolean;
  },
) => {
  const { limit = 20, cursor, includeExpired = false } = options ?? {};

  // Récupérer les IDs des traders suivis par l'utilisateur
  const follows = await prisma.follow.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      traderId: true,
    },
  });

  const traderIds = follows.map((f) => f.traderId);

  if (traderIds.length === 0) {
    // User ne suit aucun trader
    return [];
  }

  // Construire les conditions where
  const where: {
    traderId?: { in: string[] };
    expiresAt?: { gt: Date };
  } = {
    traderId: {
      in: traderIds,
    },
  };

  if (!includeExpired) {
    where.expiresAt = {
      gt: new Date(),
    };
  }

  return prisma.signal.findMany({
    where,
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          image: true,
          traderProfile: {
            select: {
              displayName: true,
              verified: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Compte le nombre de signaux actifs d'un trader
 */
export const countActiveSignalsByTrader = async (traderId: string) => {
  return prisma.signal.count({
    where: {
      traderId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
};

/**
 * Compte le nombre total de signaux d'un trader
 */
export const countTotalSignalsByTrader = async (traderId: string) => {
  return prisma.signal.count({
    where: {
      traderId,
    },
  });
};

/**
 * Récupère les signaux récents (pour homepage/landing)
 */
export const getRecentSignals = async (limit = 10) => {
  return prisma.signal.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      trader: {
        traderProfile: {
          verified: true, // Seulement traders vérifiés pour homepage
        },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      trader: {
        select: {
          id: true,
          name: true,
          image: true,
          traderProfile: {
            select: {
              displayName: true,
              verified: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Vérifie si un hash existe déjà (pour éviter doublons)
 */
export const signalHashExists = async (hash: string): Promise<boolean> => {
  const signal = await prisma.signal.findUnique({
    where: { hash },
    select: { id: true },
  });

  return !!signal;
};
