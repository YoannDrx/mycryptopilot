/**
 * API Route: User Exchange Health Cron Job
 *
 * GET /api/cron/user-exchange-health
 *
 * Validates user exchange connections periodically to detect revoked API keys.
 * Also refreshes cached balance snapshots for Risk Console & copy trading.
 */

import { route } from "@/lib/zod-route";
import { env } from "@/lib/env";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { logger } from "@/lib/logger";
import { runUserExchangeHealthJob } from "@/lib/cron/user-exchange-health-job";

export const GET = route.handler(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const expectedSecret = env.CRON_SECRET;

  if (!expectedSecret) {
    throw new ZodRouteError("Cron secret not configured", 500);
  }

  const token = authHeader?.replace("Bearer ", "");
  if (token !== expectedSecret) {
    logger.warn("Unauthorized user exchange health cron attempt", {
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
    throw new ZodRouteError("Unauthorized", 401);
  }

  try {
    const result = await runUserExchangeHealthJob();
    return { ...result, timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error("User exchange health cron failed", { error });
    throw new ZodRouteError(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
});

export const runtime = "nodejs";
export const maxDuration = 60;
