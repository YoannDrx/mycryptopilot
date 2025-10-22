import { runTierCheckJob } from "@/lib/cron/tier-check-job";
import { logger } from "@/lib/logger";
import { route } from "@/lib/zod-route";
import { env } from "@/lib/env";
import { ZodRouteError } from "@/lib/errors/zod-route-error";

/**
 * Tier Check Cron Route
 *
 * Vercel Cron endpoint pour vérifier et upgrade les tiers quotidiennement
 *
 * Schedule: Daily à 3am
 * Authentication: CRON_SECRET
 */

export const GET = route.handler(async (req) => {
  logger.info("Tier check cron triggered");

  // 1. Verify CRON_SECRET
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== env.CRON_SECRET) {
    logger.warn("Unauthorized tier check cron attempt", {
      hasAuth: !!authHeader,
    });
    throw new ZodRouteError("Unauthorized", 401);
  }

  // 2. Run tier check job
  const result = await runTierCheckJob();

  if (!result.success) {
    logger.error("Tier check job failed", { error: result.error });
    throw new ZodRouteError(result.error ?? "Tier check job failed", 500);
  }

  // 3. Return results
  logger.info("✅ Tier check cron completed", { results: result.results });

  return {
    success: true,
    timestamp: new Date().toISOString(),
    results: result.results,
  };
});
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max execution
