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

/**
 * Récupère un feed de signaux avec filtres avancés
 *
 * Utilisé pour la page /signals avec tous les filtres possibles
 */
export const getSignalsFeed = async (params?: {
  traderId?: string;
  traderName?: string;
  symbol?: string;
  symbols?: string[];
  bias?: "LONG" | "SHORT";
  status?: "ACTIVE" | "EXPIRED";
  instrumentType?: "SPOT" | "PERP";
  verifiedOnly?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  cursor?: string;
  limit?: number;
}) => {
  const {
    traderId,
    traderName,
    symbol,
    symbols,
    bias,
    status,
    instrumentType,
    verifiedOnly = false,
    createdAfter,
    createdBefore,
    cursor,
    limit = 20,
  } = params ?? {};

  // Construire les conditions where
  const where: {
    traderId?: string;
    symbol?: string | { in: string[] };
    expiresAt?: { gt: Date } | { lte: Date };
    createdAt?: { gte: Date; lte?: Date } | { lte: Date };
    trader?: {
      traderProfile?: {
        verified?: boolean;
        displayName?: { contains: string; mode: "insensitive" };
      };
    };
    AND?: {
      payloadJson?: {
        path: string[];
        equals: string;
      };
    }[];
  } = {};

  // Filter by trader ID
  if (traderId) {
    where.traderId = traderId;
  }

  // Filter by trader name (search in displayName)
  if (traderName) {
    where.trader = {
      traderProfile: {
        displayName: {
          contains: traderName,
          mode: "insensitive",
        },
      },
    };
  }

  // Filter by symbol (single or multiple)
  if (symbol) {
    where.symbol = symbol;
  } else if (symbols && symbols.length > 0) {
    where.symbol = {
      in: symbols,
    };
  }

  // Filter by status (ACTIVE/EXPIRED)
  if (status === "ACTIVE") {
    where.expiresAt = {
      gt: new Date(),
    };
  } else if (status === "EXPIRED") {
    where.expiresAt = {
      lte: new Date(),
    };
  } else {
    // Default: only show active signals
    where.expiresAt = {
      gt: new Date(),
    };
  }

  // Filter by verified traders only
  if (verifiedOnly) {
    where.trader = {
      ...where.trader,
      traderProfile: {
        ...where.trader?.traderProfile,
        verified: true,
      },
    };
  }

  // Filter by date range
  if (createdAfter && createdBefore) {
    where.createdAt = {
      gte: createdAfter,
      lte: createdBefore,
    };
  } else if (createdAfter) {
    where.createdAt = {
      gte: createdAfter,
    };
  } else if (createdBefore) {
    where.createdAt = {
      lte: createdBefore,
    };
  }

  // Filter by bias (LONG/SHORT) and instrumentType (SPOT/PERP) in JSON payload
  const andConditions = [];

  if (bias) {
    andConditions.push({
      payloadJson: {
        path: ["bias"],
        equals: bias,
      },
    });
  }

  if (instrumentType) {
    andConditions.push({
      payloadJson: {
        path: ["instrumentType"],
        equals: instrumentType,
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Execute query with pagination
  const signals = await prisma.signal.findMany({
    where,
    take: limit + 1, // Fetch one more to check if there's a next page
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

  // Check if there are more results
  const hasNextPage = signals.length > limit;
  const items = hasNextPage ? signals.slice(0, -1) : signals;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined;

  return {
    items,
    hasNextPage,
    nextCursor,
  };
};
