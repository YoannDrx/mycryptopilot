import { prisma } from "@/lib/prisma";
import type { Exchange } from "@/generated/prisma";
import { BinanceService } from "@/lib/exchange/binance-service";
import { BybitService } from "@/lib/exchange/bybit-service";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { logger } from "@/lib/logger";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import type { AssetBalance } from "@/lib/exchange/types";

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

  // Fetch all balances in parallel
  const balancePromises = connections.map(async (conn) => {
    try {
      // Decrypt API keys
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

      // Create service based on exchange type
      const service =
        conn.exchange === "BINANCE"
          ? new BinanceService(apiKey, secretKey)
          : conn.exchange === "BYBIT"
            ? new BybitService(apiKey, secretKey)
            : null;

      let totalUSDT = 0;
      let availableUSDT = 0;
      let lockedUSDT = 0;

      if (service) {
        // Fetch balance from exchange via ccxt wrapper
        const balance = await service.fetchBalance();

        const totalObj = balance.total as unknown as Record<
          string,
          number | undefined
        >;
        const freeObj = balance.free as unknown as Record<
          string,
          number | undefined
        >;
        const usedObj = balance.used as unknown as Record<
          string,
          number | undefined
        >;

        totalUSDT = totalObj.USDT ?? 0;
        availableUSDT = freeObj.USDT ?? 0;
        lockedUSDT = usedObj.USDT ?? 0;
      } else {
        // Bitget (or future exchanges) use native adapter
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
          const assetsBySymbol = consolidated.spot.assets as Record<
            string,
            AssetBalance | undefined
          >;
          const usdtAsset = assetsBySymbol.USDT;
          totalUSDT = usdtAsset?.total ?? 0;
          availableUSDT = usdtAsset?.free ?? 0;
          lockedUSDT = usdtAsset?.locked ?? 0;
        } finally {
          await adapter.close();
        }
      }

      logger.info("Fetched exchange balance for Risk Console", {
        userId,
        exchange: conn.exchange,
        available: availableUSDT,
      });

      return {
        exchange: conn.exchange,
        totalUSDT,
        available: availableUSDT,
        locked: lockedUSDT,
        isActive: true,
        lastSync: conn.lastSyncedAt,
      };
    } catch (error) {
      logger.error("Failed to fetch balance for Risk Console", {
        userId,
        exchange: conn.exchange,
        error,
      });

      // Return inactive balance on error
      return {
        exchange: conn.exchange,
        totalUSDT: 0,
        available: 0,
        locked: 0,
        isActive: false,
        lastSync: conn.lastSyncedAt,
      };
    }
  });

  // Wait for all balance fetches to complete
  const results = await Promise.allSettled(balancePromises);

  // Extract successful results
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<ExchangeBalance>).value);
}
