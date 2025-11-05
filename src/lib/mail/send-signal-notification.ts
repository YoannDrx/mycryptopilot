import { NewSignalNotificationEmail } from "@email/new-signal-notification";
import { logger } from "@/lib/logger";
import { sendEmail } from "./send-email";
import { getAppUrl } from "@/lib/urls/app-urls";

type SignalData = {
  id: string;
  asset: string;
  bias: "LONG" | "SHORT";
  instrumentType: "SPOT" | "PERP";
  entry: string;
  targets: string[];
  stopLoss: string;
  leverage?: number;
  timeframe: string;
  riskLevel: number;
  confidence: number;
  rationales: string[];
};

type SendSignalNotificationParams = {
  userEmail: string;
  userName: string;
  traderName: string;
  signal: SignalData;
};

/**
 * Send a signal notification email to a user
 */
export const sendSignalNotificationEmail = async ({
  userEmail,
  userName,
  traderName,
  signal,
}: SendSignalNotificationParams) => {
  try {
    // Build signal URL (user-centric)
    const basePath = `/signals?highlight=${signal.id}`;
    const signalUrl = getAppUrl(basePath, true);

    // Send email
    const result = await sendEmail({
      to: userEmail,
      subject: `🔔 Nouveau signal ${signal.bias} sur ${signal.asset} par ${traderName}`,
      html: NewSignalNotificationEmail({
        userName,
        traderName,
        signal,
        signalUrl,
      }),
    });

    if (result.error) {
      logger.error("[sendSignalNotificationEmail] Failed to send email", {
        error: result.error,
        userEmail,
        signalId: signal.id,
      });
      return { success: false, error: result.error };
    }

    logger.info("[sendSignalNotificationEmail] Email sent successfully", {
      userEmail,
      signalId: signal.id,
      emailId: result.data.id,
    });

    return { success: true, emailId: result.data.id };
  } catch (error) {
    logger.error("[sendSignalNotificationEmail] Unexpected error", {
      error,
      userEmail,
      signalId: signal.id,
    });
    return { success: false, error };
  }
};

/**
 * Send signal notifications to all followers of a trader
 */
export const notifyFollowersOfNewSignal = async ({
  traderId,
  traderName,
  signal,
}: {
  traderId: string;
  traderName: string;
  signal: SignalData;
}) => {
  const { prisma } = await import("@/lib/prisma");

  try {
    // Get all active followers with email notifications enabled
    const followers = await prisma.follow.findMany({
      where: {
        traderId: traderId,
        status: "ACTIVE",
        // TODO: Add email notification preference filter when field exists
        // user: {
        //   emailNotificationsEnabled: true,
        // },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            planName: true,
          },
        },
      },
    });

    if (followers.length === 0) {
      logger.info("[notifyFollowersOfNewSignal] No followers to notify", {
        traderId,
        signalId: signal.id,
      });
      return { success: true, notified: 0 };
    }

    // Send emails to all followers (in parallel)
    const emailPromises = followers.map(async (follow) => {
      return sendSignalNotificationEmail({
        userEmail: follow.user.email,
        userName: follow.user.name,
        traderName,
        signal,
      });
    });

    const results = await Promise.allSettled(emailPromises);

    // Count successful notifications
    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.success,
    ).length;

    logger.info("[notifyFollowersOfNewSignal] Notifications sent", {
      traderId,
      signalId: signal.id,
      totalFollowers: followers.length,
      successful: successCount,
      failed: followers.length - successCount,
    });

    return {
      success: true,
      notified: successCount,
      total: followers.length,
    };
  } catch (error) {
    logger.error("[notifyFollowersOfNewSignal] Failed to notify followers", {
      error,
      traderId,
      signalId: signal.id,
    });

    return { success: false, error };
  }
};
