#!/usr/bin/env tsx

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Exchange Connection Diagnostic Script
 *
 * Tests exchange connections (Binance/Bybit) to diagnose connectivity,
 * balance fetching, and trade history issues.
 *
 * Usage:
 *   pnpm tsx scripts/diagnose-exchange.ts test-binance <traderId>
 *   pnpm tsx scripts/diagnose-exchange.ts test-bybit <traderId>
 *
 * Features:
 * - Tests API connectivity and permissions
 * - Fetches balance (spot + futures if available)
 * - Fetches sample trades (BTC/USDT, last 100)
 * - Shows rate limit information
 * - No UI, pure CLI output
 *
 * Security:
 * - Does NOT expose API keys in output
 * - Decrypts keys only in memory
 * - No data stored to disk
 */

import { Command } from "commander";
import { prisma } from "@/lib/prisma";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { BinanceService } from "@/lib/exchange/binance-service";
import { BybitService } from "@/lib/exchange/bybit-service";
import { logger } from "@/lib/logger";

const program = new Command();

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("");
  log(`━━━ ${title} ━━━`, "cyan");
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green");
}

function logError(message: string) {
  log(`❌ ${message}`, "red");
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, "blue");
}

/**
 * Get trader connection from database
 */
async function getTraderConnection(traderId: string) {
  const connection = await prisma.exchangeConnection.findFirst({
    where: {
      traderProfileId: traderId,
      isActive: true,
    },
    include: {
      trader: {
        select: {
          displayName: true,
          userId: true,
        },
      },
    },
  });

  if (!connection) {
    throw new Error(
      `No active exchange connection found for trader ${traderId}`,
    );
  }

  return connection;
}

/**
 * Decrypt API keys
 */
function decryptKeys(connection: {
  encryptedApiKey: string;
  encryptedSecretKey: string;
  encryptedPassphrase?: string | null;
  keyIv: string;
  keyTag: string;
}) {
  logSection("Decrypting API Keys");

  try {
    const apiKey = decryptApiKey(
      connection.encryptedApiKey,
      connection.keyIv,
      connection.keyTag,
    );

    const secretKey = decryptSerializedPayload(
      connection.encryptedSecretKey,
      connection.keyIv,
      connection.keyTag,
    );
    const passphrase = decryptOptionalSerializedPayload(
      connection.encryptedPassphrase,
      connection.keyIv,
      connection.keyTag,
    );

    logSuccess("API keys decrypted successfully");

    return { apiKey, secretKey, passphrase };
  } catch (error) {
    logError("Failed to decrypt API keys");
    throw error;
  }
}

/**
 * Test Binance connection
 */
async function testBinance(traderId: string) {
  log("\n🔍 BINANCE DIAGNOSTIC", "bright");
  log(
    "════════════════════════════════════════════════════════════════",
    "cyan",
  );

  let balance: any = null;

  try {
    // 1. Get connection
    logSection("Fetching Connection");
    const connection = await getTraderConnection(traderId);

    if (connection.exchange !== "BINANCE") {
      logError(`This connection is for ${connection.exchange}, not BINANCE`);
      process.exit(1);
    }

    logInfo(`Trader: ${connection.trader.displayName}`);
    logInfo(`Exchange: ${connection.exchange}`);
    logInfo(
      `Last synced: ${connection.lastSyncedAt?.toISOString() ?? "Never"}`,
    );

    // 2. Decrypt keys
    const { apiKey, secretKey } = decryptKeys(connection);

    // 3. Create service
    logSection("Testing Connectivity");
    const service = new BinanceService(apiKey, secretKey);

    // 4. Validate API keys
    const validation = await service.validateApiKeys();

    if (!validation.isValid) {
      logError(`Invalid API keys: ${validation.errorMessage}`);
      process.exit(1);
    }

    logSuccess("Connection successful");
    logInfo(`Read-only: ${validation.isReadOnly ? "Yes" : "No"}`);
    logInfo(`Spot enabled: ${validation.hasSpotEnabled ? "Yes" : "No"}`);
    logInfo(`Futures enabled: ${validation.hasFuturesEnabled ? "Yes" : "No"}`);

    if (!validation.isReadOnly) {
      logWarning(
        "API keys have write permissions (should be read-only for safety)",
      );
    }

    // 5. Fetch balance
    logSection("Fetching Balance");

    try {
      balance = await service.fetchBalance();

      // Display non-zero balances
      const nonZeroBalances = Object.entries(balance)
        .filter(([asset, data]) => {
          if (
            asset === "info" ||
            asset === "free" ||
            asset === "used" ||
            asset === "total"
          ) {
            return false;
          }
          const balanceData = data as { total?: number };
          return balanceData.total && balanceData.total > 0;
        })
        .slice(0, 10); // Show first 10

      if (nonZeroBalances.length === 0) {
        logWarning("No non-zero balances found");
      } else {
        logSuccess(`Found ${nonZeroBalances.length} assets with balance`);

        nonZeroBalances.forEach(([asset, data]) => {
          const balanceData = data as {
            free?: number;
            used?: number;
            total?: number;
          };
          console.log(
            `   ${asset.padEnd(10)} | Free: ${balanceData.free?.toFixed(8) ?? "0"} | ` +
              `Used: ${balanceData.used?.toFixed(8) ?? "0"} | ` +
              `Total: ${balanceData.total?.toFixed(8) ?? "0"}`,
          );
        });

        if (Object.keys(balance).length > 12) {
          logInfo(`... and ${Object.keys(balance).length - 12} more assets`);
        }
      }

      logInfo(
        "\nNote: Balance is SPOT only (current implementation limitation)",
      );
      logWarning("Futures balance NOT included (will be fixed in refactor)");
    } catch (error) {
      logError(
        `Failed to fetch balance: ${error instanceof Error ? error.message : "Unknown"}`,
      );
    }

    // 6. Fetch sample trades
    logSection("Fetching Sample Trades (BTC/USDT, last 100)");

    try {
      // Manually fetch BTC/USDT trades for demo
      const ccxtTrades = await (service as any).exchange.fetchMyTrades(
        "BTC/USDT",
        undefined,
        100,
      );

      if (ccxtTrades.length === 0) {
        logWarning("No BTC/USDT trades found");
      } else {
        logSuccess(`Found ${ccxtTrades.length} BTC/USDT trades`);

        // Show first 3 trades
        const sampleTrades = ccxtTrades.slice(0, 3);
        sampleTrades.forEach((trade: any, index: number) => {
          console.log(`\n   Trade ${index + 1}:`);
          console.log(`   ├─ ID: ${trade.id}`);
          console.log(`   ├─ Side: ${trade.side.toUpperCase()}`);
          console.log(`   ├─ Amount: ${trade.amount} BTC`);
          console.log(`   ├─ Price: ${trade.price} USDT`);
          console.log(`   ├─ Cost: ${trade.cost} USDT`);
          console.log(`   └─ Date: ${new Date(trade.timestamp).toISOString()}`);
        });

        if (ccxtTrades.length > 3) {
          logInfo(`\n   ... and ${ccxtTrades.length - 3} more trades`);
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("does not have market symbol")
      ) {
        logWarning(
          "BTC/USDT market not found (might not be traded on this account)",
        );
      } else {
        logError(
          `Failed to fetch trades: ${error instanceof Error ? error.message : "Unknown"}`,
        );
      }
    }

    // 7. Rate limit info
    logSection("Rate Limit Information");

    // ccxt doesn't expose rate limit info directly, but we can check response headers
    logInfo("Rate limit: Managed by ccxt (automatic throttling enabled)");
    logInfo("Binance limit: 1200 requests/minute (weight-based)");

    // Try to get last response headers (not exposed by ccxt easily)
    logWarning(
      "Detailed rate limit not available with current ccxt implementation",
    );
    logInfo("Will be available after migration to native Binance SDK");

    // 8. Close connection
    await service.close();

    // Summary
    logSection("Diagnostic Summary");
    logSuccess("Connection: ✅ OK");
    logSuccess("API Keys: ✅ Valid");
    logSuccess(
      `Balance: ✅ Fetched (SPOT only, ${Object.keys(balance ?? {}).length} assets)`,
    );
    logInfo("Futures balance: ⚠️  Not included (limitation)");
    logInfo("Unrealized PnL: ⚠️  Not tracked (limitation)");
    logInfo("Pagination: ⚠️  Limited to 1000 trades per symbol (limitation)");

    log(
      "\n════════════════════════════════════════════════════════════════",
      "cyan",
    );
    log("✅ Diagnostic completed successfully\n", "green");
  } catch (error) {
    logError(
      `\n❌ Diagnostic failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    logger.error("Binance diagnostic failed", { error, traderId });
    process.exit(1);
  }
}

/**
 * Test Bybit connection
 */
async function testBybit(traderId: string) {
  log("\n🔍 BYBIT DIAGNOSTIC", "bright");
  log(
    "════════════════════════════════════════════════════════════════",
    "cyan",
  );

  let balance: any = null;

  try {
    // 1. Get connection
    logSection("Fetching Connection");
    const connection = await getTraderConnection(traderId);

    if (connection.exchange !== "BYBIT") {
      logError(`This connection is for ${connection.exchange}, not BYBIT`);
      process.exit(1);
    }

    logInfo(`Trader: ${connection.trader.displayName}`);
    logInfo(`Exchange: ${connection.exchange}`);
    logInfo(
      `Last synced: ${connection.lastSyncedAt?.toISOString() ?? "Never"}`,
    );

    // 2. Decrypt keys
    const { apiKey, secretKey } = decryptKeys(connection);

    // 3. Create service
    logSection("Testing Connectivity");
    const service = new BybitService(apiKey, secretKey);

    // 4. Validate API keys (Bybit has similar validation)
    const validation = await service.validateApiKeys();

    if (!validation.isValid) {
      logError(`Invalid API keys: ${validation.errorMessage}`);
      process.exit(1);
    }

    logSuccess("Connection successful");
    logInfo(`Read-only: ${validation.isReadOnly ? "Yes" : "No"}`);

    // 5. Fetch balance
    logSection("Fetching Balance");

    try {
      balance = await service.fetchBalance();

      // Similar to Binance, show non-zero balances
      const nonZeroBalances = Object.entries(balance)
        .filter(([asset, data]) => {
          if (
            asset === "info" ||
            asset === "free" ||
            asset === "used" ||
            asset === "total"
          ) {
            return false;
          }
          const balanceData = data as { total?: number };
          return balanceData.total && balanceData.total > 0;
        })
        .slice(0, 10);

      if (nonZeroBalances.length === 0) {
        logWarning("No non-zero balances found");
      } else {
        logSuccess(`Found ${nonZeroBalances.length} assets with balance`);

        nonZeroBalances.forEach(([asset, data]) => {
          const balanceData = data as {
            free?: number;
            used?: number;
            total?: number;
          };
          console.log(
            `   ${asset.padEnd(10)} | Free: ${balanceData.free?.toFixed(8) ?? "0"} | ` +
              `Used: ${balanceData.used?.toFixed(8) ?? "0"} | ` +
              `Total: ${balanceData.total?.toFixed(8) ?? "0"}`,
          );
        });
      }

      logInfo(
        "\nNote: Balance is SPOT only (current implementation limitation)",
      );
      logWarning("Futures balance NOT included (will be fixed in refactor)");
    } catch (error) {
      logError(
        `Failed to fetch balance: ${error instanceof Error ? error.message : "Unknown"}`,
      );
    }

    // 6. Fetch sample trades
    logSection("Fetching Sample Trades (BTC/USDT, last 100)");

    try {
      const ccxtTrades = await (service as any).exchange.fetchMyTrades(
        "BTC/USDT",
        undefined,
        100,
      );

      if (ccxtTrades.length === 0) {
        logWarning("No BTC/USDT trades found");
      } else {
        logSuccess(`Found ${ccxtTrades.length} BTC/USDT trades`);

        const sampleTrades = ccxtTrades.slice(0, 3);
        sampleTrades.forEach((trade: any, index: number) => {
          console.log(`\n   Trade ${index + 1}:`);
          console.log(`   ├─ ID: ${trade.id}`);
          console.log(`   ├─ Side: ${trade.side.toUpperCase()}`);
          console.log(`   ├─ Amount: ${trade.amount} BTC`);
          console.log(`   ├─ Price: ${trade.price} USDT`);
          console.log(`   ├─ Cost: ${trade.cost} USDT`);
          console.log(`   └─ Date: ${new Date(trade.timestamp).toISOString()}`);
        });

        if (ccxtTrades.length > 3) {
          logInfo(`\n   ... and ${ccxtTrades.length - 3} more trades`);
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("does not have market symbol")
      ) {
        logWarning(
          "BTC/USDT market not found (might not be traded on this account)",
        );
      } else {
        logError(
          `Failed to fetch trades: ${error instanceof Error ? error.message : "Unknown"}`,
        );
      }
    }

    // 7. Rate limit info
    logSection("Rate Limit Information");
    logInfo("Rate limit: Managed by ccxt (automatic throttling enabled)");
    logInfo("Bybit limit: 100 requests/second (standard tier)");
    logWarning(
      "Detailed rate limit not available with current ccxt implementation",
    );
    logInfo(
      "Will be available after migration to native Bybit SDK (+400 req/s!)",
    );

    // 8. Close connection
    await service.close();

    // Summary
    logSection("Diagnostic Summary");
    logSuccess("Connection: ✅ OK");
    logSuccess("API Keys: ✅ Valid");
    logSuccess(
      `Balance: ✅ Fetched (SPOT only, ${Object.keys(balance ?? {}).length} assets)`,
    );
    logInfo("Futures balance: ⚠️  Not included (limitation)");
    logInfo("Unrealized PnL: ⚠️  Not tracked (limitation)");

    log(
      "\n════════════════════════════════════════════════════════════════",
      "cyan",
    );
    log("✅ Diagnostic completed successfully\n", "green");
  } catch (error) {
    logError(
      `\n❌ Diagnostic failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    logger.error("Bybit diagnostic failed", { error, traderId });
    process.exit(1);
  }
}

// CLI commands
program
  .name("diagnose-exchange")
  .description("Diagnostic tool for exchange connections")
  .version("1.0.0");

program
  .command("test-binance <traderId>")
  .description("Test Binance connection for a trader")
  .action(testBinance);

program
  .command("test-bybit <traderId>")
  .description("Test Bybit connection for a trader")
  .action(testBybit);

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
