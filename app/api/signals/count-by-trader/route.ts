import { countTotalSignalsByTrader } from "@/features/signal/signal-queries";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * API Route to count total signals published by a trader
 *
 * GET /api/signals/count-by-trader?traderId=xxx
 */
export const GET = route
  .query(
    z.object({
      traderId: z.string().min(1),
    }),
  )
  .handler(async (_req, { query }) => {
    const count = await countTotalSignalsByTrader(query.traderId);

    return {
      count,
      traderId: query.traderId,
    };
  });
