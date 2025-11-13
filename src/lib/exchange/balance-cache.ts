import { EventEmitter } from "events";
import { logger } from "@/lib/logger";
import type { ConsolidatedBalance } from "./types";

/**
 * Balance Cache
 *
 * In-memory cache for real-time balance updates from WebSocket.
 * Uses EventEmitter to notify SSE endpoints when balance changes.
 *
 * Features:
 * - Store latest balance for each trader
 * - Emit events on balance updates
 * - TTL-based expiry for stale balances
 * - Thread-safe for multi-worker deployments (via Redis pub/sub in future)
 *
 * @example
 * balanceCache.set(traderId, balance);
 * balanceCache.on('balance:updated', (data) => {
 *   console.log('Balance updated:', data);
 * });
 */

type BalanceCacheEntry = {
  balance: ConsolidatedBalance;
  updatedAt: Date;
};

export class BalanceCache extends EventEmitter {
  private readonly cache = new Map<string, BalanceCacheEntry>();
  private readonly ttl: number; // TTL in milliseconds

  constructor(ttlSeconds = 300) {
    // 5 minutes default TTL
    super();
    this.ttl = ttlSeconds * 1000;

    // Clean up expired entries every minute
    setInterval(() => this.cleanupExpired(), 60 * 1000);
  }

  /**
   * Get balance for trader
   * Returns null if not found or expired
   */
  get(traderId: string): ConsolidatedBalance | null {
    const entry = this.cache.get(traderId);

    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.updatedAt.getTime();
    if (age > this.ttl) {
      this.cache.delete(traderId);
      logger.debug("Balance cache expired", { traderId, age });
      return null;
    }

    return entry.balance;
  }

  /**
   * Set balance for trader
   * Emits 'balance:updated' event
   */
  set(traderId: string, balance: ConsolidatedBalance): void {
    const entry: BalanceCacheEntry = {
      balance,
      updatedAt: new Date(),
    };

    this.cache.set(traderId, entry);

    logger.debug("Balance cache updated", {
      traderId,
      totalEquityUsd: balance.totalEquityUsd,
    });

    // Emit event for SSE listeners
    this.emit("balance:updated", {
      traderId,
      balance,
      timestamp: entry.updatedAt,
    });
  }

  /**
   * Check if balance exists and is fresh
   */
  has(traderId: string): boolean {
    return this.get(traderId) !== null;
  }

  /**
   * Remove balance from cache
   */
  delete(traderId: string): void {
    this.cache.delete(traderId);
    logger.debug("Balance cache deleted", { traderId });
  }

  /**
   * Get all cached trader IDs
   */
  getTraderIds(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logger.info("Balance cache cleared");
  }

  /**
   * Get cache stats
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    const ages = entries.map((e) => now - e.updatedAt.getTime());
    const avgAge =
      ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 0;
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;

    return {
      size: this.cache.size,
      ttl: this.ttl,
      avgAge,
      maxAge,
      minAge,
    };
  }

  /**
   * Cleanup expired entries
   * Runs automatically every minute
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [traderId, entry] of this.cache.entries()) {
      const age = now - entry.updatedAt.getTime();
      if (age > this.ttl) {
        this.cache.delete(traderId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info("Balance cache cleanup", {
        expired: expiredCount,
        remaining: this.cache.size,
      });
    }
  }
}

// Global balance cache singleton
export const balanceCache = new BalanceCache(300); // 5 minutes TTL
