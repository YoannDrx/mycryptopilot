/**
 * API Route: Get Performance Snapshot
 *
 * GET /api/performance/[traderProfileId]/[period]
 *
 * Returns performance snapshot for a trader and specific period:
 * - Key metrics (winrate, profit factor, net PnL, etc.)
 * - Trade statistics (winning/losing trades, average win/loss)
 * - Risk metrics (max drawdown, Sharpe ratio, Sortino ratio)
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/66
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getPerformanceSnapshot } from "@/features/exchange/performance-queries";

const PerformancePeriodSchema = z.enum([
  "ALL_TIME",
  "LAST_30D",
  "LAST_90D",
  "LAST_365D",
]);

export const GET = authRoute
  .params(
    z.object({
      traderProfileId: z.string().cuid(),
      period: PerformancePeriodSchema,
    }),
  )
  .handler(async (req, { params, ctx }) => {
    const { traderProfileId, period } = params;
    const userId = ctx.user.id;

    logger.info("Fetching performance snapshot", {
      userId,
      traderProfileId,
      period,
    });

    // Fetch snapshot
    const snapshot = await getPerformanceSnapshot(traderProfileId, period);

    // If no snapshot, return null (not an error - just no data yet)
    if (!snapshot) {
      logger.info("No performance snapshot found", {
        userId,
        traderProfileId,
        period,
      });
      return { snapshot: null };
    }

    // Convert Decimal/BigInt fields to numbers for JSON serialization
    return {
      snapshot: {
        id: snapshot.id,
        traderProfileId: snapshot.traderProfileId,
        period: snapshot.period,
        winrate: Number(snapshot.winrate),
        profitFactor: Number(snapshot.profitFactor),
        netPnl: Number(snapshot.netPnl),
        totalTrades: snapshot.totalTrades,
        winningTrades: snapshot.winningTrades,
        losingTrades: snapshot.losingTrades,
        averageWin: Number(snapshot.averageWin),
        averageLoss: Number(snapshot.averageLoss),
        largestWin: Number(snapshot.largestWin),
        largestLoss: Number(snapshot.largestLoss),
        maxDrawdown: Number(snapshot.maxDrawdown),
        sharpeRatio: snapshot.sharpeRatio ? Number(snapshot.sharpeRatio) : null,
        sortinoRatio: snapshot.sortinoRatio
          ? Number(snapshot.sortinoRatio)
          : null,
        calculatedAt: snapshot.calculatedAt.toISOString(),
        createdAt: snapshot.createdAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString(),
      },
    };
  });
