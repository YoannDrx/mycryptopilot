/**
 * Copy Trade Integration
 *
 * Connects signal creation with automatic copy-trading via BullMQ queue.
 * When a trader creates a signal, this module:
 * 1. Finds all followers with auto-copy enabled
 * 2. Creates CopyTrade records with PENDING status
 * 3. Queues jobs in BullMQ for execution
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { batchQueueCopyTrades } from "./copy-trade-jobs";
import type { CopyTradeJobData } from "./copy-trade-jobs";
import {
  createTraderTradeFromSignal,
  getTraderTradeBySignalId,
} from "@/lib/trading/trader-trade.service";
import { calculateSafeQuantity } from "@/lib/exchange/position-sizing.service";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";

/**
 * Queue copy trades for all followers with auto-copy enabled
 *
 * Called after a signal is created by a trader.
 * Creates CopyTrade records and queues jobs for execution.
 *
 * @param signalId - ID of the signal that was created
 * @param traderId - ID of the trader who created the signal
 * @returns {created, queued, errors} counts
 */
export async function queueAutoCopyTradesForSignal(
  signalId: string,
  traderId: string,
): Promise<{ created: number; queued: number; errors: number }> {
  logger.info("Queueing auto-copy trades for signal", {
    signalId,
    traderId,
  });

  try {
    // Get trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: traderId },
      select: { id: true },
    });

    if (!traderProfile) {
      logger.warn("Trader profile not found", { traderId });
      return { created: 0, queued: 0, errors: 0 };
    }

    // Get signal details
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      select: {
        id: true,
        symbol: true,
        payloadJson: true,
      },
    });

    if (!signal) {
      logger.error("Signal not found", { signalId });
      return { created: 0, queued: 0, errors: 0 };
    }

    // Parse signal payload to extract trade parameters
    const payload = signal.payloadJson as {
      asset?: string;
      bias?: "LONG" | "SHORT";
      instrumentType?: "SPOT" | "PERP";
      entry?: string;
      targets?: string[];
      stopLoss?: string;
      leverage?: number;
      riskLevel?: number;
    };

    const side = payload.bias === "SHORT" ? "SELL" : "BUY";
    const entry = parseFloat(payload.entry ?? "0");

    if (entry === 0) {
      logger.warn("Invalid entry price in signal payload", {
        signalId,
        payload,
      });
      return { created: 0, queued: 0, errors: 0 };
    }

    // Create or get TraderTrade from Signal
    // This is necessary because CopyTrade.originalTradeId must reference TraderTrade.id
    let traderTrade = await getTraderTradeBySignalId(signalId);

    if (!traderTrade) {
      logger.info("Creating TraderTrade from Signal for auto-copy", {
        signalId,
        traderProfileId: traderProfile.id,
      });

      traderTrade = await createTraderTradeFromSignal(
        {
          id: signal.id,
          symbol: signal.symbol,
          payloadJson: signal.payloadJson,
        },
        traderProfile.id,
      );

      // Link the signal to the trader trade
      await prisma.signal.update({
        where: { id: signalId },
        data: { linkedTradeId: traderTrade.id },
      });

      logger.info("TraderTrade created and linked to Signal", {
        signalId,
        traderTradeId: traderTrade.id,
      });
    } else {
      logger.info("Using existing TraderTrade for Signal", {
        signalId,
        traderTradeId: traderTrade.id,
      });
    }

    // Find all users with auto-copy enabled for this trader
    const autoCopyPreferences = await prisma.autoCopyPreference.findMany({
      where: {
        traderProfileId: traderProfile.id,
        isEnabled: true,
      },
      include: {
        user: {
          select: {
            id: true,
            planName: true,
          },
        },
      },
    });

    if (autoCopyPreferences.length === 0) {
      logger.info("No auto-copy followers found", {
        signalId,
        traderProfileId: traderProfile.id,
      });
      return { created: 0, queued: 0, errors: 0 };
    }

    logger.info("Found auto-copy followers", {
      signalId,
      count: autoCopyPreferences.length,
    });

    // Create CopyTrade records and prepare job data
    // Process all preferences in parallel
    const results = await Promise.allSettled(
      autoCopyPreferences.map(async (pref) => {
        // Verify user still has ULTRA plan
        if (pref.user.planName !== "ULTRA") {
          logger.warn("User no longer has ULTRA plan, skipping auto-copy", {
            userId: pref.userId,
            planName: pref.user.planName,
          });
          return null;
        }

        // Get or use default exchange connection
        let exchangeConnectionId = pref.exchangeConnectionId;

        // Fetch full exchange connection details (needed for decryption + balance)
        const exchangeConnection = exchangeConnectionId
          ? await prisma.userExchangeConnection.findUnique({
              where: { id: exchangeConnectionId },
              select: {
                id: true,
                exchange: true,
                encryptedApiKey: true,
                encryptedSecretKey: true,
                encryptedPassphrase: true,
                bitgetAccountMode: true,
                keyIv: true,
                keyTag: true,
                isActive: true,
              },
            })
          : await prisma.userExchangeConnection.findFirst({
              where: {
                userId: pref.userId,
                isActive: true,
              },
              select: {
                id: true,
                exchange: true,
                encryptedApiKey: true,
                encryptedSecretKey: true,
                encryptedPassphrase: true,
                bitgetAccountMode: true,
                keyIv: true,
                keyTag: true,
                isActive: true,
              },
            });

        if (!exchangeConnection) {
          logger.warn("No active exchange connection found for user", {
            userId: pref.userId,
            signalId,
          });
          return null;
        }

        exchangeConnectionId = exchangeConnection.id;

        // ========== Calculate Safe Quantity with Real Balance ==========

        try {
          // Decrypt API keys
          const apiKey = decryptApiKey(
            exchangeConnection.encryptedApiKey,
            exchangeConnection.keyIv,
            exchangeConnection.keyTag,
          );
          const secretKey = decryptSerializedPayload(
            exchangeConnection.encryptedSecretKey,
            exchangeConnection.keyIv,
            exchangeConnection.keyTag,
          );
          const passphrase = decryptOptionalSerializedPayload(
            exchangeConnection.encryptedPassphrase,
            exchangeConnection.keyIv,
            exchangeConnection.keyTag,
          );

          // Calculate safe quantity based on user's actual balance
          const safeQuantityResult = await calculateSafeQuantity({
            userId: pref.userId,
            connectionId: exchangeConnection.id,
            exchange: exchangeConnection.exchange,
            apiKey,
            secretKey,
            passphrase,
            bitgetAccountMode:
              exchangeConnection.bitgetAccountMode ?? undefined,
            symbol: signal.symbol,
            entryPrice: entry,
            instrumentType: payload.instrumentType ?? "SPOT",
            copyRatio: pref.copyRatio,
            maxAmount: pref.maxAmountPerTrade,
          });

          logger.info("Safe quantity calculated", {
            userId: pref.userId,
            symbol: signal.symbol,
            quantity: safeQuantityResult.quantity,
            positionSizeUsd: safeQuantityResult.positionSizeUsd,
            availableBalanceUsd: safeQuantityResult.availableBalanceUsd,
            limitApplied: safeQuantityResult.limitApplied,
            warnings: safeQuantityResult.warnings,
          });

          // Use calculated safe quantity
          const copyQuantity = safeQuantityResult.quantity;

          // Warn if position is below minimum or has other issues
          if (safeQuantityResult.warnings.length > 0) {
            logger.warn("Position sizing warnings", {
              userId: pref.userId,
              warnings: safeQuantityResult.warnings,
            });
          }

          // Create CopyTrade record with PENDING status
          const copyTrade = await prisma.copyTrade.create({
            data: {
              userId: pref.userId,
              originalTradeId: traderTrade.id, // ✅ Now using TraderTrade.id instead of signalId
              mode: "AUTO",
              status: "PENDING",
              notes: `Auto-copy from signal ${signalId}`,
            },
          });

          // Prepare job data
          const jobData: CopyTradeJobData = {
            userId: pref.userId,
            copyTradeId: copyTrade.id,
            originalTradeId: traderTrade.id, // ✅ Use TraderTrade.id for consistency
            traderProfileId: traderProfile.id,
            symbol: signal.symbol,
            side,
            orderType: "MARKET", // Default to market orders for auto-copy
            quantity: copyQuantity, // ✅ Now using calculated safe quantity
            limitPrice: entry,
            stopLoss: payload.stopLoss
              ? parseFloat(payload.stopLoss)
              : undefined,
            takeProfit: payload.targets?.map((t) => parseFloat(t)),
            copyRatio: pref.copyRatio,
            maxAmount: pref.maxAmountPerTrade?.toNumber(),
            exchangeId: exchangeConnectionId,
            createdAt: new Date(),
            signalId,
            instrumentType: payload.instrumentType ?? "SPOT", // ✅ Pass instrumentType to worker
          };

          return jobData;
        } catch (error) {
          logger.error("Failed to calculate safe quantity", {
            userId: pref.userId,
            signalId,
            error: error instanceof Error ? error.message : String(error),
          });

          // Return null to skip this user (will be logged as error later)
          return null;
        }
      }),
    );

    // Process results
    const jobs: CopyTradeJobData[] = [];
    let created = 0;
    let errors = 0;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        jobs.push(result.value);
        created++;
      } else if (result.status === "rejected") {
        logger.error("Failed to create copy trade", {
          signalId,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        });
        errors++;
      }
    }

    // Batch queue all jobs
    const { created: queued, failed } = await batchQueueCopyTrades(jobs);

    logger.info("Auto-copy trades queued", {
      signalId,
      created,
      queued,
      failed,
      errors,
    });

    // Update auto-copy preferences stats
    const updatePromises = autoCopyPreferences.map(async (pref) =>
      prisma.autoCopyPreference.update({
        where: { id: pref.id },
        data: {
          totalCopiesMade: { increment: 1 },
          lastCopiedAt: new Date(),
        },
      }),
    );

    await Promise.all(updatePromises);

    return {
      created,
      queued,
      errors: errors + failed,
    };
  } catch (error) {
    logger.error("Failed to queue auto-copy trades", {
      signalId,
      traderId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      created: 0,
      queued: 0,
      errors: 1,
    };
  }
}

/**
 * Check if user has auto-copy enabled for a trader
 *
 * Used by UI to show auto-copy status
 *
 * @param userId - User ID
 * @param traderProfileId - Trader profile ID
 * @returns Auto-copy preference or null
 */
export async function getAutoCopyPreference(
  userId: string,
  traderProfileId: string,
) {
  return prisma.autoCopyPreference.findUnique({
    where: {
      userId_traderProfileId: {
        userId,
        traderProfileId,
      },
    },
  });
}

/**
 * Get all auto-copy preferences for a user
 *
 * Shows which traders the user is auto-copying
 *
 * @param userId - User ID
 * @returns List of auto-copy preferences
 */
export async function getUserAutoCopyPreferences(userId: string) {
  return prisma.autoCopyPreference.findMany({
    where: { userId },
    include: {
      traderProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      lastCopiedAt: "desc",
    },
  });
}

/**
 * Get auto-copy stats for a trader
 *
 * Shows how many users are auto-copying this trader
 *
 * @param traderProfileId - Trader profile ID
 * @returns {total, active} counts
 */
export async function getTraderAutoCopyStats(traderProfileId: string) {
  const preferences = await prisma.autoCopyPreference.findMany({
    where: { traderProfileId },
  });

  return {
    total: preferences.length,
    active: preferences.filter((p) => p.isEnabled).length,
    inactive: preferences.filter((p) => !p.isEnabled).length,
  };
}
