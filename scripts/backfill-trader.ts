#!/usr/bin/env tsx

import { Command } from "commander";
import { backfillTraderTrades } from "@/lib/exchange/trade-backfill.service";
import { logger } from "@/lib/logger";

const program = new Command();

program
  .description("Backfill historical trades for a trader profile")
  .requiredOption("-t, --trader <traderProfileId>", "Trader profile ID")
  .option("-d, --days <days>", "Number of days to backfill", (value) => parseInt(value, 10), 365)
  .option("--dry-run", "Simulate without writing to the database", false)
  .action(async (options) => {
    try {
      const summary = await backfillTraderTrades(options.trader, {
        days: options.days,
        dryRun: options.dryRun,
      });

      logger.info("Backfill completed", summary);
      process.exit(0);
    } catch (error) {
      logger.error("Backfill failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  });

program.parse();
