import { searchTraders } from "@/features/trader/trader-queries";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * API Route for searching traders in the marketplace
 * Used by client-side filtering to avoid full page reloads
 */

export const GET = route
  .query(
    z.object({
      search: z.string().optional(),
      verified: z
        .string()
        .optional()
        .transform((val) => {
          if (val === "true") return true;
          if (val === "false") return false;
          return undefined;
        }),
      sort: z
        .enum(["recent", "winrate", "followers", "signals"])
        .optional()
        .default("recent"),
      cursor: z.string().optional(),
      limit: z.coerce.number().optional().default(12),
    }),
  )
  .handler(async (_req, { query }) => {
    const { search, verified, sort, cursor, limit } = query;

    const result = await searchTraders({
      search,
      verified,
      sortBy: sort,
      cursor,
      limit,
    });

    return result;
  });
