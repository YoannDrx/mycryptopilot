/**
 * Backfill Script: Populate entryQuantity, exitQuantity, netQuantity
 *
 * Recalculates quantity fields for existing TraderTrades that have fills.
 * This ensures old data is populated with the new quantity tracking fields.
 *
 * Run with: pnpm tsx scripts/backfill-trader-trade-quantities.ts
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Decimal } from "@prisma/client/runtime/library";

async function backfillTraderTradeQuantities() {
  logger.info("Starting backfill for TraderTrade quantity fields");

  // Find all TraderTrades that need backfilling (where new fields are 0)
  const tradesToBackfill = await prisma.traderTrade.findMany({
    where: {
      OR: [{ entryQuantity: 0 }, { exitQuantity: 0 }, { netQuantity: 0 }],
      // Only backfill trades that have fills
      fills: {
        some: {},
      },
    },
    include: {
      fills: {
        orderBy: { executedAt: "asc" },
      },
    },
  });

  logger.info(`Found ${tradesToBackfill.length} trades to backfill`);

  let successCount = 0;
  let errorCount = 0;

  for (const trade of tradesToBackfill) {
    try {
      // Calculate quantities from fills
      let entryQuantity = 0;
      let exitQuantity = 0;
      let entryValueSum = 0;
      let exitValueSum = 0;
      let totalFees = 0;

      for (const fill of trade.fills) {
        const quantity = Number(fill.quantity);
        const price = Number(fill.price);
        const fee = Number(fill.fee);

        totalFees += fee;

        if (trade.side === "BUY") {
          // Long position: entry = buys, exit = sells
          if (fill.side === "BUY") {
            entryQuantity += quantity;
            entryValueSum += quantity * price;
          } else {
            exitQuantity += quantity;
            exitValueSum += quantity * price;
          }
        } else {
          // Short position: entry = sells, exit = buys
          if (fill.side === "SELL") {
            entryQuantity += quantity;
            entryValueSum += quantity * price;
          } else {
            exitQuantity += quantity;
            exitValueSum += quantity * price;
          }
        }
      }

      const netQuantity = entryQuantity - exitQuantity;

      // Recalculate weighted averages
      const averageEntry =
        entryQuantity > 0
          ? entryValueSum / entryQuantity
          : Number(trade.averageEntry);
      const averageExit =
        exitQuantity > 0
          ? exitValueSum / exitQuantity
          : trade.averageExit
            ? Number(trade.averageExit)
            : null;

      // Recalculate totalQuantity using new logic
      const totalQuantity =
        trade.status === "CLOSED" || trade.status === "PARTIAL"
          ? Math.max(entryQuantity, exitQuantity)
          : Math.abs(netQuantity);

      // Update trade with recalculated values
      // eslint-disable-next-line no-await-in-loop
      await prisma.traderTrade.update({
        where: { id: trade.id },
        data: {
          entryQuantity: new Decimal(entryQuantity),
          exitQuantity: new Decimal(exitQuantity),
          netQuantity: new Decimal(netQuantity),
          totalQuantity: new Decimal(totalQuantity),
          averageEntry: new Decimal(averageEntry),
          averageExit: averageExit ? new Decimal(averageExit) : null,
          fees: new Decimal(totalFees),
        },
      });

      successCount++;

      if (successCount % 100 === 0) {
        logger.info(`Backfilled ${successCount} trades so far...`);
      }
    } catch (error) {
      logger.error("Failed to backfill trade", {
        tradeId: trade.id,
        error,
      });
      errorCount++;
    }
  }

  logger.info("Backfill completed", {
    total: tradesToBackfill.length,
    success: successCount,
    errors: errorCount,
  });
}

// Run backfill
backfillTraderTradeQuantities()
  .then(() => {
    logger.info("Backfill script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Backfill script failed", { error });
    process.exit(1);
  });
