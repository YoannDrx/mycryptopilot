import { isFollowingTrader } from "@/features/follow/follow-queries";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * API Route to check if current user is following a trader
 *
 * GET /api/follow/is-following?traderId=xxx
 */
export const GET = route
  .query(
    z.object({
      traderId: z.string().min(1),
    }),
  )
  .handler(async (_req, { query }) => {
    const user = await getRequiredUser();
    const isFollowing = await isFollowingTrader(user.id, query.traderId);

    return {
      isFollowing,
      userId: user.id,
      traderId: query.traderId,
    };
  });
