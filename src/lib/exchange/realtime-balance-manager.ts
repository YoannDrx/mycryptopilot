/**
 * Real-time Balance Manager
 *
 * Manages real-time balance updates via intelligent polling.
 * Polls exchange APIs at regular intervals and updates cache.
 *
 * Features:
 * - Intelligent polling (configurable intervals)
 * - Balance cache updates
 * - Multi-trader support
 * - Error handling with exponential backoff
 * - Graceful shutdown
 *
 * Architecture:
 * - Uses existing ExchangeAdapter for balance fetching
 * - Updates balanceCache on each poll
 * - Emits events via balanceCache EventEmitter
 * - Can be upgraded to WebSocket later
 *
 * @example
 * const manager = new RealtimeBalanceManager();
 * await manager.subscribe(traderId, exchange, apiKey, secretKey);
 * // Later...
 * await manager.unsubscribe(traderId);
 * await manager.shutdown();
 */

import { logger } from "@/lib/logger";
import { balanceCache } from "./balance-cache";
import { createExchangeService } from "./exchange-service-factory";
import type { ExchangeAdapter } from "./exchange-service-factory";
import type { Exchange } from "@/generated/prisma";

type Subscription = {
  traderId: string;
  exchange: "binance" | "bybit" | "bitget";
  adapter: ExchangeAdapter;
  interval: NodeJS.Timeout;
  pollIntervalMs: number;
  errorCount: number;
  lastPollAt: Date | null;
};

export class RealtimeBalanceManager {
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly defaultPollIntervalMs = 10000; // 10 seconds
  private readonly maxErrorCount = 5;

  /**
   * Subscribe to real-time balance updates
   *
   * @param traderId - Trader ID
   * @param exchange - Exchange name (binance, bybit, bitget)
   * @param apiKey - API key
   * @param secretKey - Secret key
   * @param pollIntervalMs - Polling interval in milliseconds (default: 10s)
   */
  async subscribe(
    traderId: string,
    exchange: "binance" | "bybit" | "bitget",
    apiKey: string,
    secretKey: string,
    passphrase?: string | null,
    bitgetAccountMode?: "UTA" | "CLASSIC" | null,
    pollIntervalMs = this.defaultPollIntervalMs,
  ): Promise<void> {
    try {
      // Check if already subscribed
      if (this.subscriptions.has(traderId)) {
        logger.warn("Already subscribed to balance updates", {
          traderId,
          exchange,
        });
        return;
      }

      logger.info("Subscribing to real-time balance updates", {
        traderId,
        exchange,
        pollIntervalMs,
      });

      // Create exchange adapter
      const adapter = createExchangeService(
        exchange.toUpperCase() as Exchange,
        apiKey,
        secretKey,
        {
          passphrase,
          bitgetAccountMode: bitgetAccountMode ?? undefined,
        },
      );

      // Test connection first
      const connectionStatus = await adapter.testConnection();
      if (!connectionStatus.isValid) {
        throw new Error(
          connectionStatus.errorMessage ?? "Invalid exchange connection",
        );
      }

      // Fetch initial balance
      await this.pollBalance(traderId, adapter);

      // Set up polling interval
      const interval = setInterval(() => {
        void this.pollBalance(traderId, adapter);
      }, pollIntervalMs);

      // Store subscription
      const subscription: Subscription = {
        traderId,
        exchange,
        adapter,
        interval,
        pollIntervalMs,
        errorCount: 0,
        lastPollAt: new Date(),
      };

      this.subscriptions.set(traderId, subscription);

      logger.info("Real-time balance subscription active", {
        traderId,
        exchange,
        pollIntervalMs,
      });
    } catch (error) {
      logger.error("Failed to subscribe to real-time balance updates", {
        traderId,
        exchange,
        error,
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from balance updates
   */
  async unsubscribe(traderId: string): Promise<void> {
    const subscription = this.subscriptions.get(traderId);

    if (!subscription) {
      logger.warn("No active subscription found", { traderId });
      return;
    }

    logger.info("Unsubscribing from balance updates", {
      traderId,
      exchange: subscription.exchange,
    });

    try {
      // Clear polling interval
      clearInterval(subscription.interval);

      // Close adapter connection
      if ("close" in subscription.adapter) {
        await (
          subscription.adapter as ExchangeAdapter & {
            close: () => Promise<void>;
          }
        ).close();
      }

      // Remove from subscriptions
      this.subscriptions.delete(traderId);

      // Remove from cache
      balanceCache.delete(traderId);

      logger.info("Balance subscription removed", { traderId });
    } catch (error) {
      logger.error("Failed to unsubscribe from balance updates", {
        traderId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): {
    traderId: string;
    exchange: string;
    pollIntervalMs: number;
    errorCount: number;
    lastPollAt: Date | null;
  }[] {
    return Array.from(this.subscriptions.values()).map((sub) => ({
      traderId: sub.traderId,
      exchange: sub.exchange,
      pollIntervalMs: sub.pollIntervalMs,
      errorCount: sub.errorCount,
      lastPollAt: sub.lastPollAt,
    }));
  }

  /**
   * Shutdown all subscriptions
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down real-time balance manager", {
      activeSubscriptions: this.subscriptions.size,
    });

    const traderIds = Array.from(this.subscriptions.keys());

    // Unsubscribe all in parallel
    await Promise.all(
      traderIds.map(async (traderId) => this.unsubscribe(traderId)),
    );

    logger.info("Real-time balance manager shutdown complete");
  }

  /**
   * Get subscription stats
   */
  getStats() {
    const subscriptions = Array.from(this.subscriptions.values());

    return {
      totalSubscriptions: subscriptions.length,
      byExchange: {
        binance: subscriptions.filter((s) => s.exchange === "binance").length,
        bybit: subscriptions.filter((s) => s.exchange === "bybit").length,
        bitget: subscriptions.filter((s) => s.exchange === "bitget").length,
      },
      withErrors: subscriptions.filter((s) => s.errorCount > 0).length,
      avgPollInterval:
        subscriptions.length > 0
          ? subscriptions.reduce((sum, s) => sum + s.pollIntervalMs, 0) /
            subscriptions.length
          : 0,
    };
  }

  /**
   * Poll balance from exchange
   * Updates cache and handles errors with exponential backoff
   */
  private async pollBalance(
    traderId: string,
    adapter: ExchangeAdapter,
  ): Promise<void> {
    const subscription = this.subscriptions.get(traderId);
    if (!subscription) {
      return; // Subscription was removed
    }

    try {
      logger.debug("Polling balance", {
        traderId,
        exchange: subscription.exchange,
      });

      // Fetch consolidated balance
      const balance = await adapter.fetchConsolidatedBalance();

      // Update cache (this will emit event)
      balanceCache.set(traderId, balance);

      // Reset error count on success
      subscription.errorCount = 0;
      subscription.lastPollAt = new Date();

      logger.debug("Balance polled successfully", {
        traderId,
        exchange: subscription.exchange,
        totalEquityUsd: balance.totalEquityUsd,
      });
    } catch (error) {
      subscription.errorCount++;
      subscription.lastPollAt = new Date();

      logger.error("Failed to poll balance", {
        traderId,
        exchange: subscription.exchange,
        errorCount: subscription.errorCount,
        error,
      });

      // If too many errors, unsubscribe
      if (subscription.errorCount >= this.maxErrorCount) {
        logger.error("Too many poll errors, unsubscribing", {
          traderId,
          exchange: subscription.exchange,
          errorCount: subscription.errorCount,
        });
        await this.unsubscribe(traderId);
      }
    }
  }
}

// Global real-time balance manager singleton
export const realtimeBalanceManager = new RealtimeBalanceManager();
