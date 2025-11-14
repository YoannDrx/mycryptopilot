import { getBalanceCacheStats } from "@/lib/exchange/balance-cache.service";
import { getRedisSubscriberStats } from "@/lib/redis/redis-pubsub";
import { getCopyTradeQueueStats } from "@/lib/queue/copy-trade-jobs";

export async function getRealtimeHealthStats() {
  const [cacheStats, redisStats, queueStats] = await Promise.all([
    getBalanceCacheStats(),
    Promise.resolve(getRedisSubscriberStats()),
    getCopyTradeQueueStats(),
  ]);

  return {
    cacheStats,
    redisStats,
    queueStats,
  };
}
