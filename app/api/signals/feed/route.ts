import { getSignalsFeed } from "@/features/signal/signal-queries";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * GET /api/signals/feed - Fetch paginated signals with filters
 * Used by infinite scroll client component
 */
export const GET = route
  .query(
    z.object({
      cursor: z.string().optional(),
      symbols: z.union([z.string(), z.array(z.string())]).optional(),
      bias: z.enum(["LONG", "SHORT"]).optional(),
      status: z.enum(["ACTIVE", "EXPIRED"]).optional(),
      instrumentType: z.enum(["SPOT", "PERP"]).optional(),
      traderName: z.string().optional(),
      verifiedOnly: z.string().optional(),
    }),
  )
  .handler(async (_req, { query }) => {
    // Parse filters
    const symbols = Array.isArray(query.symbols)
      ? query.symbols
      : query.symbols
        ? [query.symbols]
        : undefined;

    const verifiedOnly = query.verifiedOnly === "true";

    // Fetch signals
    const result = await getSignalsFeed({
      symbols,
      bias: query.bias,
      status: query.status,
      instrumentType: query.instrumentType,
      traderName: query.traderName,
      verifiedOnly,
      cursor: query.cursor,
      limit: 12,
    });

    return Response.json({
      items: result.items,
      hasNextPage: result.hasNextPage,
      nextCursor: result.nextCursor,
    });
  });
