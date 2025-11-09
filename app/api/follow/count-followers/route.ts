import { countTraderFollowers } from "@/features/follow/follow-queries";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * API Route to count followers of a trader
 *
 * GET /api/follow/count-followers?traderId=xxx
 */
export const GET = route
  .query(
    z.object({
      traderId: z.string().min(1),
    }),
  )
  .handler(async (_req, { query }) => {
    const count = await countTraderFollowers(query.traderId);

    return {
      count,
      traderId: query.traderId,
    };
  });
