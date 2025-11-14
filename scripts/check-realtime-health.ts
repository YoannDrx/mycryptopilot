#!/usr/bin/env tsx

import { getRealtimeHealthStats } from "@/lib/monitoring/realtime-health";
import { sendMonitoringAlert } from "@/lib/monitoring/alerts";
import { logger } from "@/lib/logger";

async function main() {
  const stats = await getRealtimeHealthStats();
  const alerts: string[] = [];

  if ((stats.queueStats.failed ?? 0) > 5) {
    alerts.push(`⚠️ ${stats.queueStats.failed} jobs en échec dans BullMQ`);
  }

  if ((stats.redisStats.channels ?? 0) > 200) {
    alerts.push(
      `⚠️ ${stats.redisStats.channels} canaux SSE actifs (seuil 200)`,
    );
  }

  if (stats.cacheStats && stats.cacheStats.totalKeys === 0) {
    alerts.push("⚠️ Cache des balances vide – vérifier le worker realtime");
  }

  if (alerts.length === 0) {
    logger.info("Realtime health OK", stats);
    return;
  }

  const message = alerts.join("\n");
  await sendMonitoringAlert(message);
}

main().catch((error) => {
  logger.error("Realtime health check failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
