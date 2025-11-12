import { logger } from "@/lib/logger";
import { getConnectionsToSync } from "@/features/exchange/exchange-queries";
import { syncMultipleConnections } from "@/lib/exchange/sync-service";

type ExchangeSyncResult = {
  success: boolean;
  connectionsProcessed: number;
  successful: number;
  failed: number;
  totalTradesImported: number;
  totalTradesFetched: number;
  durationMs: number;
};

/**
 * Core logic shared by the HTTP cron route and the Fly.io worker.
 *
 * Fetches pending exchange connections, syncs them sequentially
 * (respecting rate limits), and returns summary statistics.
 */
export async function runExchangeSyncCronJob(): Promise<ExchangeSyncResult> {
  logger.info("=== Starting exchange sync cron job ===");

  const startTime = Date.now();

  // 1. Fetch connections ready for sync
  const connections = await getConnectionsToSync();

  if (connections.length === 0) {
    logger.info("No connections to sync", {
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      connectionsProcessed: 0,
      successful: 0,
      failed: 0,
      totalTradesImported: 0,
      totalTradesFetched: 0,
      durationMs: Date.now() - startTime,
    };
  }

  logger.info("Found connections to sync", {
    count: connections.length,
  });

  // 2. Sync all connections sequentially
  const results = await syncMultipleConnections(connections);

  // 3. Calculate summary stats
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const totalTradesImported = results.reduce(
    (sum, r) => sum + r.tradesImported,
    0,
  );
  const totalTradesFetched = results.reduce(
    (sum, r) => sum + r.tradesFetched,
    0,
  );

  const duration = Date.now() - startTime;

  logger.info("=== Exchange sync cron job completed ===", {
    connectionsProcessed: connections.length,
    successful: successCount,
    failed: failureCount,
    totalTradesImported,
    totalTradesFetched,
    durationMs: duration,
  });

  return {
    success: true,
    connectionsProcessed: connections.length,
    successful: successCount,
    failed: failureCount,
    totalTradesImported,
    totalTradesFetched,
    durationMs: duration,
  };
}
