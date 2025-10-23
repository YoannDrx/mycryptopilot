/**
 * Exchange Sync Service
 *
 * Core synchronization engine for exchange connections.
 *
 * Features:
 * - Decrypts API keys securely
 * - Fetches trades from exchanges (Binance, Bybit - spot + futures)
 * - Upserts trades with idempotence (via externalOrderId)
 * - Updates sync metadata (lastSyncedAt, nextSyncAt, errors)
 * - Handles errors gracefully with detailed logging
 *
 * Flow:
 * 1. Decrypt API keys from DB
 * 2. Create exchange service instance (Binance or Bybit)
 * 3. Fetch trades (last 30 days on first sync, incremental after)
 * 4. Upsert trades to DB (idempotent)
 * 5. Update connection metadata
 * 6. Cleanup (close exchange connection)
 *
 * @example
 * const result = await syncConnectionTrades(connection);
 * if (result.success) {
 *   console.log(`Synced ${result.tradesImported} trades`);
 * }
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { decryptApiKey } from "@/lib/crypto/encryption-service";
import {
  createExchangeService,
  type ExchangeService,
} from "@/lib/exchange/exchange-service-factory";
import type { ExchangeConnection } from "@/generated/prisma";
import { calculateNextSyncAt } from "@/features/exchange/exchange-plan-limits";
import { sendSyncFailureNotification } from "@/lib/exchange/email-notifications";

type SyncResult = {
  success: boolean;
  tradesImported: number;
  tradesFetched: number;
  error?: string;
};

type ConnectionWithPlan = ExchangeConnection & {
  trader: {
    user: {
      planName: string | null;
    };
  };
};

/**
 * Sync trades for a single exchange connection
 *
 * @param connection - Exchange connection with trader.user.planName included
 * @returns SyncResult - Success status and trade counts
 */
export async function syncConnectionTrades(
  connection: ConnectionWithPlan,
): Promise<SyncResult> {
  const startTime = Date.now();

  logger.info("Starting exchange sync", {
    connectionId: connection.id,
    exchange: connection.exchange,
    traderProfileId: connection.traderProfileId,
  });

  let exchangeService: ExchangeService | null = null;

  try {
    // 1. Decrypt API keys
    const apiKey = decryptApiKey(
      connection.encryptedApiKey,
      connection.keyIv,
      connection.keyTag,
    );
    const secretKey = decryptApiKey(
      connection.encryptedSecretKey,
      connection.keyIv,
      connection.keyTag,
    );

    // 2. Create exchange service (Binance or Bybit)
    exchangeService = createExchangeService(
      connection.exchange,
      apiKey,
      secretKey,
    );

    // 3. Determine sync period
    // First sync: get last 30 days
    // Subsequent syncs: get trades since last sync
    const daysSince = connection.lastSyncedAt
      ? Math.ceil(
          (Date.now() - connection.lastSyncedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 30;

    const sinceDate = connection.lastSyncedAt ?? undefined;

    logger.info("Fetching trades from exchange", {
      connectionId: connection.id,
      exchange: connection.exchange,
      daysSince,
      sinceDate: sinceDate?.toISOString(),
    });

    // 4. Fetch trades
    const trades = await exchangeService.fetchRecentTrades(
      daysSince,
      sinceDate,
    );

    logger.info("Trades fetched from exchange", {
      connectionId: connection.id,
      exchange: connection.exchange,
      tradeCount: trades.length,
    });

    // 5. Upsert trades to database (idempotent via externalOrderId)
    // Use Promise.all to parallelize inserts (faster than sequential)
    const upsertPromises = trades.map(async (trade) =>
      prisma.exchangeTrade
        .upsert({
          where: {
            externalOrderId: trade.externalOrderId,
          },
          update: {
            // Update fields that might change (e.g., realized PnL for futures)
            realizedPnl: trade.realizedPnl,
          },
          create: {
            connectionId: connection.id,
            externalOrderId: trade.externalOrderId,
            symbol: trade.symbol,
            side: trade.side,
            type: trade.type,
            quantity: trade.quantity,
            price: trade.price,
            quoteQuantity: trade.quoteQuantity,
            fee: trade.fee,
            feeAsset: trade.feeAsset,
            realizedPnl: trade.realizedPnl,
            executedAt: trade.executedAt,
          },
        })
        .then(() => ({ success: true }))
        .catch((error) => {
          // Log but don't fail entire sync if one trade fails
          logger.warn("Failed to import trade", {
            connectionId: connection.id,
            externalOrderId: trade.externalOrderId,
            error,
          });
          return { success: false };
        }),
    );

    const upsertResults = await Promise.all(upsertPromises);
    const importedCount = upsertResults.filter((r) => r.success).length;

    // 6. Update connection metadata
    const planName = connection.trader.user.planName;
    const nextSyncAt = calculateNextSyncAt(planName);

    await prisma.exchangeConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        nextSyncAt,
        lastSyncError: null, // Clear previous errors
        updatedAt: new Date(),
      },
    });

    // 7. Recalculate performance metrics for all periods
    if (importedCount > 0) {
      logger.info("Recalculating performance snapshots", {
        connectionId: connection.id,
        traderProfileId: connection.traderProfileId,
      });

      // Fetch all trades for this trader (across all connections)
      const allTraderTrades = await prisma.exchangeTrade.findMany({
        where: {
          connection: {
            traderProfileId: connection.traderProfileId,
          },
        },
        orderBy: {
          executedAt: "asc",
        },
      });

      const { updatePerformanceSnapshots } = await import(
        "@/lib/exchange/performance-calculator"
      );
      await updatePerformanceSnapshots(
        connection.traderProfileId,
        allTraderTrades,
      );

      logger.info("Performance snapshots updated", {
        connectionId: connection.id,
        traderProfileId: connection.traderProfileId,
      });
    }

    const duration = Date.now() - startTime;

    logger.info("Exchange sync completed successfully", {
      connectionId: connection.id,
      exchange: connection.exchange,
      tradesFetched: trades.length,
      tradesImported: importedCount,
      durationMs: duration,
      nextSyncAt: nextSyncAt?.toISOString(),
    });

    return {
      success: true,
      tradesImported: importedCount,
      tradesFetched: trades.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown sync error";

    logger.error("Exchange sync failed", {
      connectionId: connection.id,
      exchange: connection.exchange,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    });

    // Update connection with error
    try {
      await prisma.exchangeConnection.update({
        where: { id: connection.id },
        data: {
          lastSyncError: errorMessage,
          updatedAt: new Date(),
        },
      });
    } catch (updateError) {
      logger.error("Failed to update sync error", {
        connectionId: connection.id,
        updateError,
      });
    }

    // Send email notification (with rate limiting)
    try {
      await sendSyncFailureNotification({
        connectionId: connection.id,
        traderProfileId: connection.traderProfileId,
        exchange: connection.exchange,
        errorMessage,
        lastSuccessfulSync: connection.lastSyncedAt ?? undefined,
      });
    } catch (emailError) {
      // Email failure should not block sync result
      logger.error("Failed to send sync failure email", {
        connectionId: connection.id,
        emailError,
      });
    }

    return {
      success: false,
      tradesImported: 0,
      tradesFetched: 0,
      error: errorMessage,
    };
  } finally {
    // 7. Cleanup: always close exchange connection
    if (exchangeService) {
      try {
        await exchangeService.close();
        logger.info("Exchange connection closed", {
          connectionId: connection.id,
          exchange: connection.exchange,
        });
      } catch (closeError) {
        logger.warn("Failed to close exchange connection", {
          connectionId: connection.id,
          exchange: connection.exchange,
          closeError,
        });
      }
    }
  }
}

/**
 * Sync multiple connections in batch
 *
 * Used by cron job to process all pending connections
 *
 * @param connections - Array of connections to sync
 * @returns Array of sync results
 */
export async function syncMultipleConnections(
  connections: ConnectionWithPlan[],
): Promise<SyncResult[]> {
  logger.info("Starting batch sync", {
    connectionCount: connections.length,
  });

  const results: SyncResult[] = [];

  // Sequential processing to avoid rate limiting (intentional await in loop)

  for (const connection of connections) {
    // eslint-disable-next-line no-await-in-loop
    const result = await syncConnectionTrades(connection);
    results.push(result);

    // Add delay between syncs to avoid rate limiting
    if (connections.length > 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s delay
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const totalImported = results.reduce((sum, r) => sum + r.tradesImported, 0);

  logger.info("Batch sync completed", {
    total: connections.length,
    successful: successCount,
    failed: connections.length - successCount,
    totalTradesImported: totalImported,
  });

  return results;
}
