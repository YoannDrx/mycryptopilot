#!/usr/bin/env tsx

/**
 * Real-time Balance Worker
 *
 * Worker script for Fly.io that manages real-time balance updates.
 * Subscribes to balance updates for all active traders and keeps cache fresh.
 *
 * Features:
 * - Automatic subscription management
 * - Periodic trader discovery (every 5 minutes)
 * - Graceful shutdown on SIGTERM/SIGINT
 * - Health checks via HTTP endpoint
 * - Logging and monitoring
 *
 * Deployment:
 * - Runs as Fly.io worker (separate from web app)
 * - Uses same DATABASE_URL as web app
 * - Configured via fly.worker.toml
 *
 * @example
 * # Local development
 * pnpm tsx scripts/start-realtime-balance-worker.ts
 *
 * # Fly.io deployment
 * fly deploy --config fly.worker.toml
 */

import { createServer } from "http";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { realtimeBalanceManager } from "@/lib/exchange/realtime-balance-manager";
import { balanceCache } from "@/lib/exchange/balance-cache";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";

const PORT = Number(process.env.PORT ?? 8080);
const TRADER_DISCOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const BALANCE_POLL_INTERVAL_MS = 10 * 1000; // 10 seconds

/**
 * Get all active traders with exchange connections
 */
async function discoverActiveTraders() {
  try {
    logger.info("Discovering active traders");

    const connections = await prisma.userExchangeConnection.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        exchange: true,
        encryptedApiKey: true,
        encryptedSecretKey: true,
        encryptedPassphrase: true,
        bitgetAccountMode: true,
        keyIv: true,
        keyTag: true,
        user: {
          select: {
            id: true,
            name: true,
            traderProfile: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    logger.info("Active traders discovered", {
      totalConnections: connections.length,
      traders: connections.filter((c) => c.user.traderProfile).length,
    });

    return connections;
  } catch (error) {
    logger.error("Failed to discover active traders", { error });
    return [];
  }
}

/**
 * Subscribe to balance updates for all active traders
 */
async function subscribeAllTraders() {
  try {
    logger.info("Subscribing to balance updates for all active traders");

    const connections = await discoverActiveTraders();
    const activeSubscriptions = realtimeBalanceManager.getActiveSubscriptions();

    // Get currently subscribed trader IDs
    const subscribedTraderIds = new Set(
      activeSubscriptions.map((s) => s.traderId),
    );

    // Subscribe to new traders (in parallel)
    const subscribePromises = connections
      .filter(
        (conn) =>
          !subscribedTraderIds.has(conn.userId) && conn.user.traderProfile,
      )
      .map(async (conn) => {
        const traderId = conn.userId;

        try {
          // Decrypt API keys using encryption service
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

          // Subscribe to real-time balance updates
          await realtimeBalanceManager.subscribe(
            traderId,
            conn.exchange.toLowerCase() as "binance" | "bybit" | "bitget",
            apiKey,
            secretKey,
            passphrase,
            conn.bitgetAccountMode ?? undefined,
            BALANCE_POLL_INTERVAL_MS,
          );

          logger.info("Subscribed to trader balance", {
            traderId,
            exchange: conn.exchange,
            // traderProfile exists due to filter above
            traderName: conn.user.traderProfile?.displayName ?? "Unknown",
          });
        } catch (error) {
          logger.error("Failed to subscribe to trader balance", {
            traderId,
            exchange: conn.exchange,
            error,
          });
        }
      });

    await Promise.all(subscribePromises);

    // Unsubscribe from inactive traders (in parallel)
    const activeTraderIds = new Set(connections.map((c) => c.userId));
    const unsubscribePromises = activeSubscriptions
      .filter((sub) => !activeTraderIds.has(sub.traderId))
      .map(async (sub) => {
        logger.info("Unsubscribing from inactive trader", {
          traderId: sub.traderId,
        });
        await realtimeBalanceManager.unsubscribe(sub.traderId);
      });

    await Promise.all(unsubscribePromises);

    const stats = realtimeBalanceManager.getStats();
    logger.info("Subscription sync complete", stats);
  } catch (error) {
    logger.error("Failed to subscribe all traders", { error });
  }
}

/**
 * Health check HTTP server
 * Used by Fly.io health checks
 */
function startHealthCheckServer() {
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      const stats = realtimeBalanceManager.getStats();
      const cacheStats = balanceCache.getStats();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          subscriptions: stats,
          cache: cacheStats,
        }),
      );
    } else if (req.url === "/metrics") {
      const stats = realtimeBalanceManager.getStats();
      const cacheStats = balanceCache.getStats();

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`# HELP subscriptions_total Total number of active subscriptions
# TYPE subscriptions_total gauge
subscriptions_total ${stats.totalSubscriptions}

# HELP subscriptions_binance Number of Binance subscriptions
# TYPE subscriptions_binance gauge
subscriptions_binance ${stats.byExchange.binance}

# HELP subscriptions_bybit Number of Bybit subscriptions
# TYPE subscriptions_bybit gauge
subscriptions_bybit ${stats.byExchange.bybit}

# HELP subscriptions_with_errors Number of subscriptions with errors
# TYPE subscriptions_with_errors gauge
subscriptions_with_errors ${stats.withErrors}

# HELP cache_size Number of cached balances
# TYPE cache_size gauge
cache_size ${cacheStats.size}

# HELP cache_avg_age_ms Average age of cached balances in milliseconds
# TYPE cache_avg_age_ms gauge
cache_avg_age_ms ${cacheStats.avgAge}
`);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(PORT, () => {
    logger.info("Health check server listening", { port: PORT });
  });

  return server;
}

/**
 * Main worker function
 */
async function main() {
  logger.info("Starting real-time balance worker");

  // Start health check server
  const server = startHealthCheckServer();

  // Initial subscription sync
  await subscribeAllTraders();

  // Periodic trader discovery
  const discoveryInterval = setInterval(() => {
    void subscribeAllTraders();
  }, TRADER_DISCOVERY_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down real-time balance worker");

    // Stop discovery
    clearInterval(discoveryInterval);

    // Close health check server
    server.close();

    // Unsubscribe all traders
    await realtimeBalanceManager.shutdown();

    // Close database connection
    await prisma.$disconnect();

    logger.info("Worker shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  logger.info("Real-time balance worker started successfully", {
    port: PORT,
    discoveryIntervalMs: TRADER_DISCOVERY_INTERVAL_MS,
    pollIntervalMs: BALANCE_POLL_INTERVAL_MS,
  });
}

// Run worker
main().catch((error) => {
  logger.error("Worker crashed", { error });
  process.exit(1);
});
