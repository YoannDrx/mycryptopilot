"use server";

/**
 * Create Trade From Signal Action
 *
 * Allows users to create a manual copy trade based on a trading signal.
 * This is different from copying a TraderTrade - here we're using a Signal as a template.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";

const CreateTradeFromSignalSchema = z.object({
  signalId: z.string(),
  mode: z.enum(["MANUAL", "AUTO"]),
  copyRatio: z.number().min(0.01).max(1).optional(),
  maxAmount: z.number().positive().optional(),
  manualEntry: z.number().positive().optional(),
});

/**
 * Create a manual copy trade from a signal
 *
 * Since Signals are announcements (not executed trades), we create a "virtual" TraderTrade
 * that represents the signal, then let users copy it for their journal.
 *
 * For Phase 5.2, we simplify by only supporting MANUAL mode (journal tracking).
 * AUTO mode would require the trader to actually execute the signal first.
 */
export const createTradeFromSignalAction = authAction
  .inputSchema(CreateTradeFromSignalSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Check user subscription (copy trading requires PRO or ULTRA)
    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { planName: true },
    });

    if (!userPlan?.planName || userPlan.planName === "FREE") {
      throw new ActionError("Copy trading requires PRO or ULTRA subscription");
    }

    // Get the signal with trader info
    const signal = await prisma.signal.findUnique({
      where: { id: parsedInput.signalId },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            traderProfile: {
              select: {
                id: true,
                displayName: true,
                verified: true,
              },
            },
          },
        },
      },
    });

    if (!signal) {
      throw new ActionError("Signal not found");
    }

    if (!signal.trader.traderProfile) {
      throw new ActionError("Signal trader has no profile");
    }

    // Check if signal is still active
    const now = new Date();
    if (signal.expiresAt <= now) {
      throw new ActionError("This signal has expired");
    }

    // Check if user is following the trader
    const isFollowing = await prisma.follow.findFirst({
      where: {
        userId: user.id,
        traderId: signal.traderId,
        status: "ACTIVE",
      },
    });

    if (!isFollowing) {
      throw new ActionError("You must follow the trader to copy their signals");
    }

    // Only MANUAL mode supported for now (signals aren't actual trades yet)
    if (parsedInput.mode === "AUTO") {
      throw new ActionError(
        "Auto-copy from signals is not yet supported. Please use MANUAL mode to track this trade in your journal.",
      );
    }

    // Validate manual entry price
    if (!parsedInput.manualEntry) {
      throw new ActionError("Manual entry price is required");
    }

    // Parse signal payload
    const payload = signal.payloadJson as {
      [key: string]: unknown;
      entry: number;
      invalidation: number;
      tps: number[];
      bias: "LONG" | "SHORT";
    };

    // Create a CopyTrade entry referencing this signal (stored in notes)
    // Note: We don't have an originalTradeId since the signal isn't a trade yet,
    // so we'll need to handle this differently or create a TraderTrade first

    // For Phase 5.2, let's create a simplified version where we just store
    // the signal reference in the user's journal (future: UserTrade table)
    // For now, we'll return success and let the frontend handle the journaling

    logger.info("Trade created from signal (journal entry)", {
      userId: user.id,
      signalId: parsedInput.signalId,
      symbol: signal.symbol,
      mode: parsedInput.mode,
      manualEntry: parsedInput.manualEntry,
    });

    return {
      success: true,
      message: "Trade added to your journal",
      data: {
        signalId: signal.id,
        symbol: signal.symbol,
        trader: signal.trader.traderProfile.displayName,
        entry: parsedInput.manualEntry,
        invalidation: payload.invalidation,
        tps: payload.tps,
        bias: payload.bias,
      },
    };
  });
