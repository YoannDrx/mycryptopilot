import { prisma } from "@/lib/prisma";
import type { Exchange } from "@/generated/prisma";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { logger } from "@/lib/logger";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import {
  balanceToExchangeMetrics,
  getLatestSnapshotsMap,
  isSnapshotFresh,
  persistBalanceSnapshot,
  snapshotToConsolidatedBalance,
} from "@/lib/exchange/balance-snapshot.service";

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

export type ExchangeConnectionWithTrader = NonNullable<
  Awaited<ReturnType<typeof getExchangeConnectionById>>
>;

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

/**
 * Exchange Balance Type
 */
export type ExchangeBalance = {
  exchange: "BINANCE" | "BYBIT" | "BITGET";
  totalUSDT: number;
  available: number;
  locked: number;
  isActive: boolean;
  lastSync: Date | null;
  capturedAt: Date | null;
  source: "live" | "snapshot" | "error";
};

/**
 * Get exchange balances for a user (Risk Console feature)
 *
 * Fetches live USDT balance from connected exchanges (Binance/Bybit).
 * Used by Risk Console to auto-fill capital from exchange accounts.
 *
 * @param userId - The user ID
 * @returns Array of exchange balances with live data
 */
export async function getUserExchangeBalances(
  userId: string,
): Promise<ExchangeBalance[]> {
  const connections = await prisma.userExchangeConnection.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      exchange: true,
      encryptedApiKey: true,
      encryptedSecretKey: true,
      encryptedPassphrase: true,
      keyIv: true,
      keyTag: true,
      lastSyncedAt: true,
      bitgetAccountMode: true,
    },
  });

  if (connections.length === 0) {
    return [];
  }

  const snapshotMap = await getLatestSnapshotsMap(
    connections.map((conn) => conn.id),
  );

  const balancePromises = connections.map(async (conn) => {
    const cachedSnapshot = snapshotMap.get(conn.id);

    if (cachedSnapshot && isSnapshotFresh(cachedSnapshot)) {
      const consolidated = snapshotToConsolidatedBalance(cachedSnapshot);
      const metrics = balanceToExchangeMetrics(consolidated);

      return {
        exchange: conn.exchange,
        totalUSDT: metrics.totalUSDT,
        available: metrics.availableUSDT,
        locked: metrics.lockedUSDT,
        isActive: true,
        lastSync: conn.lastSyncedAt,
        capturedAt: cachedSnapshot.capturedAt,
        source: "snapshot" as const,
      };
    }

    try {
      const apiKey = decryptApiKey(
        conn.encryptedApiKey,
        conn.keyIv,
        conn.keyTag,
      );
      const secretKey = decryptSerializedPayload(
        conn.encryptedSecretKey,
        conn.keyIv,
        conn.keyTag,
      );
      const passphrase = decryptOptionalSerializedPayload(
        conn.encryptedPassphrase,
        conn.keyIv,
        conn.keyTag,
      );

      const adapter = createExchangeService(
        conn.exchange,
        apiKey,
        secretKey,
        {
          passphrase,
          bitgetAccountMode: conn.bitgetAccountMode ?? undefined,
        },
      );

      try {
        const consolidated = await adapter.fetchConsolidatedBalance();
        const metrics = balanceToExchangeMetrics(consolidated);

        await persistBalanceSnapshot({
          connectionId: conn.id,
          userId,
          exchange: conn.exchange,
          balance: consolidated,
        });

        logger.info("Fetched exchange balance for Risk Console", {
          userId,
          exchange: conn.exchange,
          available: metrics.availableUSDT,
        });

        return {
          exchange: conn.exchange,
          totalUSDT: metrics.totalUSDT,
          available: metrics.availableUSDT,
          locked: metrics.lockedUSDT,
          isActive: true,
          lastSync: conn.lastSyncedAt,
          capturedAt: consolidated.timestamp,
          source: "live" as const,
        };
      } finally {
        await adapter.close();
      }
    } catch (error) {
      logger.error("Failed to fetch balance for Risk Console", {
        userId,
        exchange: conn.exchange,
        error,
      });

      if (cachedSnapshot) {
        const fallback = balanceToExchangeMetrics(
          snapshotToConsolidatedBalance(cachedSnapshot),
        );
        return {
          exchange: conn.exchange,
          totalUSDT: fallback.totalUSDT,
          available: fallback.availableUSDT,
          locked: fallback.lockedUSDT,
          isActive: false,
          lastSync: conn.lastSyncedAt,
          capturedAt: cachedSnapshot.capturedAt,
          source: "snapshot" as const,
        };
      }

      return {
        exchange: conn.exchange,
        totalUSDT: 0,
        available: 0,
        locked: 0,
        isActive: false,
        lastSync: conn.lastSyncedAt,
        capturedAt: null,
        source: "error" as const,
      };
    }
  });

  return Promise.all(balancePromises);
}
