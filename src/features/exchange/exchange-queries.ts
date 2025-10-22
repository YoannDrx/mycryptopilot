import { prisma } from "@/lib/prisma";
import type { Exchange } from "@/generated/prisma";

/**
 * Get all exchange connections for a trader
 *
 * @param traderProfileId - The trader profile ID
 * @returns Array of exchange connections
 */
export async function getTraderExchangeConnections(traderProfileId: string) {
  return prisma.exchangeConnection.findMany({
    where: {
      traderProfileId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get a specific exchange connection by ID
 *
 * @param connectionId - The connection ID
 * @returns Exchange connection or null
 */
export async function getExchangeConnectionById(connectionId: string) {
  return prisma.exchangeConnection.findUnique({
    where: {
      id: connectionId,
    },
    include: {
      trader: {
        select: {
          userId: true,
          displayName: true,
          user: {
            select: {
              planName: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Check if a trader already has a connection for a specific exchange
 *
 * @param traderProfileId - The trader profile ID
 * @param exchange - The exchange name (e.g., "BINANCE")
 * @returns Existing connection or null
 */
export async function getExistingConnection(
  traderProfileId: string,
  exchange: Exchange,
) {
  return prisma.exchangeConnection.findUnique({
    where: {
      traderProfileId_exchange: {
        traderProfileId,
        exchange,
      },
    },
  });
}

/**
 * Count active exchange connections for a trader
 *
 * @param traderProfileId - The trader profile ID
 * @returns Number of active connections
 */
export async function countTraderConnections(traderProfileId: string) {
  return prisma.exchangeConnection.count({
    where: {
      traderProfileId,
      isActive: true,
    },
  });
}

/**
 * Get all active connections that need to be synced
 *
 * Used by cron job to sync exchanges
 *
 * @returns Array of connections ready for sync
 */
export async function getConnectionsToSync() {
  const now = new Date();

  return prisma.exchangeConnection.findMany({
    where: {
      isActive: true,
      OR: [
        { nextSyncAt: null }, // Never synced
        { nextSyncAt: { lte: now } }, // Ready for sync
      ],
    },
    include: {
      trader: {
        select: {
          userId: true,
          displayName: true,
          user: {
            select: {
              planName: true,
            },
          },
        },
      },
    },
    orderBy: {
      lastSyncedAt: "asc", // Prioritize least recently synced
    },
    take: 50, // Limit batch size
  });
}

/**
 * Get trade statistics for a connection
 *
 * @param connectionId - The connection ID
 * @returns Trade stats (total trades, date range)
 */
export async function getConnectionTradeStats(connectionId: string) {
  const [totalTrades, firstTrade, lastTrade] = await Promise.all([
    prisma.exchangeTrade.count({
      where: { connectionId },
    }),
    prisma.exchangeTrade.findFirst({
      where: { connectionId },
      orderBy: { executedAt: "asc" },
      select: { executedAt: true },
    }),
    prisma.exchangeTrade.findFirst({
      where: { connectionId },
      orderBy: { executedAt: "desc" },
      select: { executedAt: true },
    }),
  ]);

  return {
    totalTrades,
    firstTradeDate: firstTrade?.executedAt ?? null,
    lastTradeDate: lastTrade?.executedAt ?? null,
  };
}
