"use server";

/**
 * Portfolio Server Actions
 *
 * Server-side actions for portfolio analytics and performance metrics.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";
import { calculatePortfolioAnalytics } from "@/lib/trading/portfolio-analytics.service";
import { getTraderTrades } from "@/features/trader-trade/trader-trade-queries";

// ============= Schemas =============

const GetPortfolioAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  traderProfileId: z.string().optional(), // If not provided, use current user's profile
});

const GetTradeHistorySchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  status: z.enum(["OPEN", "CLOSED", "PARTIAL"]).optional(),
  symbol: z.string().optional(),
});

const GetPerformanceSnapshotSchema = z.object({
  period: z.enum(["day", "week", "month", "year", "all"]).default("month"),
});

// ============= Actions =============

/**
 * Get portfolio analytics for the current trader
 */
export const getPortfolioAnalyticsAction = authAction
  .inputSchema(GetPortfolioAnalyticsSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Get trader profile
    let traderProfileId = parsedInput.traderProfileId;

    if (!traderProfileId) {
      const traderProfile = await prisma.traderProfile.findUnique({
        where: { userId: user.id },
      });

      if (!traderProfile) {
        throw new ActionError("Trader profile not found");
      }

      traderProfileId = traderProfile.id;
    } else {
      // Verify access if viewing another trader's analytics
      const traderProfile = await prisma.traderProfile.findUnique({
        where: { id: traderProfileId },
      });

      if (!traderProfile) {
        throw new ActionError("Trader profile not found");
      }

      // Only allow viewing public traders or own profile
      if (traderProfile.userId !== user.id && !traderProfile.verified) {
        throw new ActionError(
          "You can only view analytics for verified traders",
        );
      }
    }

    const startDate = parsedInput.startDate
      ? new Date(parsedInput.startDate)
      : undefined;
    const endDate = parsedInput.endDate
      ? new Date(parsedInput.endDate)
      : undefined;

    const analytics = await calculatePortfolioAnalytics(
      traderProfileId,
      startDate,
      endDate,
    );

    logger.info("Portfolio analytics retrieved", {
      userId: user.id,
      traderProfileId,
      totalTrades: analytics.totalTrades,
    });

    return analytics;
  });

/**
 * Get trade history for the current trader
 */
export const getTradeHistoryAction = authAction
  .inputSchema(GetTradeHistorySchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    const trades = await getTraderTrades(traderProfile.id, {
      limit: parsedInput.limit,
      status: parsedInput.status,
      symbol: parsedInput.symbol,
      orderBy: "openedAt",
      orderDir: "desc",
    });

    logger.info("Trade history retrieved", {
      userId: user.id,
      traderProfileId: traderProfile.id,
      count: trades.length,
    });

    return trades;
  });

/**
 * Get performance snapshot for quick overview
 */
export const getPerformanceSnapshotAction = authAction
  .inputSchema(GetPerformanceSnapshotSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    // Calculate period boundaries
    const now = new Date();
    let startDate: Date;

    switch (parsedInput.period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get trades for the period
    const trades = await prisma.traderTrade.findMany({
      where: {
        traderProfileId: traderProfile.id,
        closedAt: {
          gte: startDate,
        },
      },
    });

    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    const openTrades = trades.filter((t) => t.status === "OPEN");

    // Calculate basic metrics
    const totalPnL = closedTrades.reduce(
      (sum, t) => sum + Number(t.realizedPnl ?? 0),
      0,
    );
    const winningTrades = closedTrades.filter(
      (t) => Number(t.realizedPnl ?? 0) > 0,
    );
    const losingTrades = closedTrades.filter(
      (t) => Number(t.realizedPnl ?? 0) < 0,
    );
    const winRate =
      closedTrades.length > 0
        ? (winningTrades.length / closedTrades.length) * 100
        : 0;

    // Calculate change from previous period
    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime()),
    );
    const previousTrades = await prisma.traderTrade.findMany({
      where: {
        traderProfileId: traderProfile.id,
        status: "CLOSED",
        closedAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    const previousPnL = previousTrades.reduce(
      (sum, t) => sum + Number(t.realizedPnl ?? 0),
      0,
    );

    const pnlChange =
      previousPnL !== 0
        ? ((totalPnL - previousPnL) / Math.abs(previousPnL)) * 100
        : totalPnL > 0
          ? 100
          : 0;

    const snapshot = {
      period: parsedInput.period,
      totalPnL,
      pnlChange,
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winRate,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      bestTrade:
        winningTrades.length > 0
          ? winningTrades.reduce((best, t) =>
              Number(t.realizedPnl) > Number(best.realizedPnl) ? t : best,
            )
          : null,
      worstTrade:
        losingTrades.length > 0
          ? losingTrades.reduce((worst, t) =>
              Number(t.realizedPnl) < Number(worst.realizedPnl) ? t : worst,
            )
          : null,
    };

    logger.info("Performance snapshot generated", {
      userId: user.id,
      traderProfileId: traderProfile.id,
      period: parsedInput.period,
      totalPnL,
    });

    return snapshot;
  });

/**
 * Export portfolio data
 */
export const exportPortfolioDataAction = authAction
  .inputSchema(
    z.object({
      format: z.enum(["csv", "json"]).default("json"),
      includeOpenTrades: z.boolean().default(true),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });

    if (!traderProfile) {
      throw new ActionError("Trader profile not found");
    }

    const trades = await prisma.traderTrade.findMany({
      where: {
        traderProfileId: traderProfile.id,
        ...(parsedInput.includeOpenTrades ? {} : { status: "CLOSED" }),
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    if (parsedInput.format === "json") {
      return {
        format: "json",
        data: trades,
        filename: `portfolio-${new Date().toISOString()}.json`,
      };
    }

    // Convert to CSV
    const headers = [
      "Date Opened",
      "Date Closed",
      "Symbol",
      "Side",
      "Status",
      "Quantity",
      "Entry Price",
      "Exit Price",
      "Realized PnL",
      "Fees",
      "Source",
    ];

    const rows = trades.map((t) => [
      t.openedAt.toISOString(),
      t.closedAt?.toISOString() ?? "",
      t.symbol,
      t.side,
      t.status,
      t.totalQuantity.toString(),
      t.averageEntry.toString(),
      t.averageExit?.toString() ?? "",
      t.realizedPnl?.toString() ?? "",
      t.fees.toString(),
      t.source,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    logger.info("Portfolio data exported", {
      userId: user.id,
      format: parsedInput.format,
      tradeCount: trades.length,
    });

    return {
      format: "csv",
      data: csv,
      filename: `portfolio-${new Date().toISOString()}.csv`,
    };
  });
