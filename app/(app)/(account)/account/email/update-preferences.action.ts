"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { resend } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { env } from "process";
import { z } from "zod";

const UpdateEmailPreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  emailNotifyNewSignals: z.boolean().optional(),
  emailNotifySubscriptionReminders: z.boolean().optional(),
  emailNotifyExchangeSyncFailures: z.boolean().optional(),
  emailNotifyTraderInvitations: z.boolean().optional(),
  emailNotifyWeeklyPerformance: z.boolean().optional(),
  emailNotifyMarketingUpdates: z.boolean().optional(),
});

export const updateEmailPreferencesAction = authAction
  .inputSchema(UpdateEmailPreferencesSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    logger.debug("Update email preferences", { input, userId: ctx.user.id });

    // Update user preferences in database
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: input,
    });

    // Synchronize master toggle with Resend unsubscribed status (optional)
    // If emailNotificationsEnabled is being toggled, update Resend contact
    if (
      input.emailNotificationsEnabled !== undefined &&
      env.RESEND_AUDIENCE_ID
    ) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: ctx.user.id },
          select: { resendContactId: true },
        });

        if (user?.resendContactId) {
          await resend.contacts.update({
            audienceId: env.RESEND_AUDIENCE_ID,
            id: user.resendContactId,
            unsubscribed: !input.emailNotificationsEnabled, // Inverse: enabled=false → unsubscribed=true
          });

          logger.info("Synchronized email preferences with Resend", {
            userId: ctx.user.id,
            emailNotificationsEnabled: input.emailNotificationsEnabled,
          });
        }
      } catch (error) {
        // Don't fail the action if Resend sync fails, just log it
        logger.error("Failed to sync preferences with Resend", {
          userId: ctx.user.id,
          error,
        });
      }
    }

    return { success: true };
  });
