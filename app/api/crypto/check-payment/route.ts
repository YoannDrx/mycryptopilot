/**
 * API Route: Check Crypto Payment Status
 *
 * POST /api/crypto/check-payment
 *
 * Polls blockchain for payment confirmation:
 * - Queries Base (USDC) and Tron (USDT) addresses
 * - Checks for confirmed transactions (1 block Base, 2 blocks Tron)
 * - Updates CryptoPayment status in DB
 * - Activates subscription if payment confirmed
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/34
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkAddressForPayments } from "@/lib/crypto/payment-watcher";
import { getPlanFromAmount, calculateDaysGranted } from "@/lib/crypto/mycryptopilot-plans";
import { activateSubscription } from "@/lib/subscription/subscription-manager";

const CheckPaymentSchema = z.object({
  baseAddressId: z.string(),
  tronAddressId: z.string(),
});

export const POST = authRoute
  .body(CheckPaymentSchema)
  .handler(async (req, { body, ctx }) => {
    const { baseAddressId, tronAddressId } = body;
    const userId = ctx.user.id;

    logger.info("Checking payment status", { userId, baseAddressId, tronAddressId });

    try {
      // Fetch addresses from DB
      const [baseAddress, tronAddress] = await Promise.all([
        prisma.cryptoAddress.findUnique({
          where: { id: baseAddressId, userId },
        }),
        prisma.cryptoAddress.findUnique({
          where: { id: tronAddressId, userId },
        }),
      ]);

      if (!baseAddress || !tronAddress) {
        logger.error("Addresses not found", { baseAddressId, tronAddressId, userId });
        return {
          confirmed: false,
          error: "Invalid address IDs",
        };
      }

      // Check for payments on both networks
      const [basePayments, tronPayments] = await Promise.all([
        checkAddressForPayments(baseAddress.address, "BASE"),
        checkAddressForPayments(tronAddress.address, "TRON"),
      ]);

      // Find first confirmed payment (if any)
      const confirmedPayment = [...basePayments, ...tronPayments].find(
        (payment) => payment.confirmations >= (payment.network === "BASE" ? 1 : 2)
      );

      if (!confirmedPayment) {
        logger.info("No confirmed payments found", { userId });
        return {
          confirmed: false,
          pending: basePayments.length > 0 || tronPayments.length > 0,
        };
      }

      // Payment confirmed! Process subscription activation
      logger.info("Payment confirmed", {
        userId,
        txHash: confirmedPayment.txHash,
        amount: confirmedPayment.amountUSD,
        network: confirmedPayment.network,
      });

      // Detect plan from amount
      const plan = getPlanFromAmount(confirmedPayment.amountUSD);
      const daysGranted = calculateDaysGranted(confirmedPayment.amountUSD, plan);

      // Create or update CryptoPayment record
      const existingPayment = await prisma.cryptoPayment.findFirst({
        where: {
          userId,
          txHash: confirmedPayment.txHash,
        },
      });

      if (!existingPayment) {
        await prisma.cryptoPayment.create({
          data: {
            userId,
            plan,
            network: confirmedPayment.network,
            currency: confirmedPayment.currency,
            amountToken: confirmedPayment.amountToken.toString(),
            amountUSD: confirmedPayment.amountUSD.toString(),
            txHash: confirmedPayment.txHash,
            confirmations: confirmedPayment.confirmations,
            status: "CONFIRMED",
            daysGranted,
            confirmedAt: confirmedPayment.timestamp,
          },
        });
      }

      // Activate subscription
      const activationResult = await activateSubscription({
        userId,
        plan,
        daysGranted,
      });

      if (!activationResult.success) {
        logger.error("Failed to activate subscription", {
          userId,
          plan,
          error: activationResult.error,
        });
        return {
          confirmed: true,
          error: "Payment confirmed but subscription activation failed",
        };
      }

      logger.info("Subscription activated successfully", {
        userId,
        plan,
        periodEnd: activationResult.periodEnd,
      });

      return {
        confirmed: true,
        plan,
        daysGranted,
        periodEnd: activationResult.periodEnd?.toISOString(),
        txHash: confirmedPayment.txHash,
      };
    } catch (error) {
      logger.error("Check payment error", { error, userId });
      return {
        confirmed: false,
        error: "Failed to check payment status",
      };
    }
  });
