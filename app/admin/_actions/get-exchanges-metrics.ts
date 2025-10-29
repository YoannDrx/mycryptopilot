/**
 * Exchanges Metrics Service
 *
 * Récupère les métriques d'intégration exchanges pour le dashboard admin.
 *
 * Métriques calculées:
 * - Total connexions
 * - Connexions actives
 * - Split par exchange (Binance/Bybit)
 * - Total trades synced
 * - Connexions avec erreurs de sync
 * - Trades ce mois (30 derniers jours)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ====================================
// Types
// ====================================

export type ExchangesMetrics = {
  totalConnections: number;
  activeConnections: number;
  exchangeSplit: {
    BINANCE: number;
    BYBIT: number;
  };
  totalTrades: number;
  tradesThisMonth: number;
  connectionsWithErrors: number;
  lastUpdated: Date;
};

// ====================================
// Main Function
// ====================================

/**
 * Récupère les métriques complètes des exchanges
 *
 * Cette fonction:
 * 1. Compte le total des connexions
 * 2. Compte les connexions actives (isActive = true)
 * 3. Split par exchange (BINANCE/BYBIT)
 * 4. Compte le total des trades synced
 * 5. Compte les connexions avec erreurs de sync (lastSyncError != null)
 * 6. Compte les trades ce mois (30 derniers jours)
 */
export async function getExchangesMetrics(): Promise<ExchangesMetrics> {
  logger.info("Fetching exchanges metrics");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Total connexions
  const totalConnections = await prisma.exchangeConnection.count();

  // 2. Connexions actives
  const activeConnections = await prisma.exchangeConnection.count({
    where: {
      isActive: true,
    },
  });

  // 3. Exchange split (count par exchange pour connexions actives)
  const exchangeSplit = {
    BINANCE: 0,
    BYBIT: 0,
  };

  const exchangeResults = await prisma.exchangeConnection.groupBy({
    by: ["exchange"],
    where: { isActive: true },
    _count: { id: true },
  });

  for (const result of exchangeResults) {
    if (result.exchange in exchangeSplit) {
      exchangeSplit[result.exchange as keyof typeof exchangeSplit] =
        result._count.id;
    }
  }

  // 4. Total trades synced
  const totalTrades = await prisma.exchangeTrade.count();

  // 5. Trades ce mois (30 derniers jours)
  const tradesThisMonth = await prisma.exchangeTrade.count({
    where: {
      executedAt: { gte: thirtyDaysAgo },
    },
  });

  // 6. Connexions avec erreurs de sync
  const connectionsWithErrors = await prisma.exchangeConnection.count({
    where: {
      lastSyncError: { not: null },
    },
  });

  const metrics: ExchangesMetrics = {
    totalConnections,
    activeConnections,
    exchangeSplit,
    totalTrades,
    tradesThisMonth,
    connectionsWithErrors,
    lastUpdated: new Date(),
  };

  logger.info("Exchanges metrics calculated", {
    totalConnections,
    activeConnections,
    totalTrades,
    tradesThisMonth,
    connectionsWithErrors,
  });

  return metrics;
}
