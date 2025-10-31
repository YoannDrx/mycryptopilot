/**
 * Send email notification after successful sweep to Binance
 *
 * Sends a summary email with:
 * - Total amount swept
 * - Transaction details (Base + Tron)
 * - Explorer links
 * - Binance wallet addresses
 */

import { logger } from "@/lib/logger";
import SweepNotificationEmail from "../../../emails/sweep-notification";
import { resend } from "./resend";
import { env } from "@/lib/env";

type SweepTransaction = {
  network: "BASE" | "TRON";
  amount: string;
  currency: string;
  txHash: string;
  explorerUrl: string;
  timestamp: Date;
};

type SendSweepNotificationProps = {
  transactions: SweepTransaction[];
  totalAmountUSD: number;
  binanceWallets: {
    base?: string;
    tron?: string;
  };
};

export async function sendSweepNotification({
  transactions,
  totalAmountUSD,
  binanceWallets,
}: SendSweepNotificationProps) {
  try {
    // Get notification email from env (optional)
    const toEmail =
      process.env.SWEEP_NOTIFICATION_EMAIL ?? env.NEXT_PUBLIC_EMAIL_CONTACT;

    if (!toEmail) {
      logger.warn("No notification email configured - skipping sweep email");
      return { success: false, reason: "No notification email configured" };
    }

    // Check if email notifications are enabled
    const emailEnabled =
      process.env.SWEEP_EMAIL_NOTIFICATION?.toLowerCase() === "true";

    if (!emailEnabled) {
      logger.info(
        "Sweep email notifications disabled (SWEEP_EMAIL_NOTIFICATION=false)",
      );
      return { success: false, reason: "Email notifications disabled" };
    }

    logger.info("Sending sweep notification email", {
      to: toEmail,
      transactionCount: transactions.length,
      totalAmountUSD,
    });

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `🧹 Sweep Completed - $${totalAmountUSD.toFixed(2)} Transferred to Binance`,
      react: SweepNotificationEmail({
        transactions,
        totalAmountUSD,
        binanceWallets,
      }),
    });

    if (error) {
      logger.error("Failed to send sweep notification email", { error });
      return { success: false, error };
    }

    logger.info("Sweep notification email sent successfully", {
      emailId: data.id,
    });
    return { success: true, emailId: data.id };
  } catch (error) {
    logger.error("Failed to send sweep notification email", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
