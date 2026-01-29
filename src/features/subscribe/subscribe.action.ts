"use server";

import { action } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  source: z
    .enum(["mobile_app_waitlist", "newsletter", "early_access"])
    .default("mobile_app_waitlist"),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export const subscribeToWaitlist = action
  .schema(subscribeSchema)
  .action(async ({ parsedInput }) => {
    const { email, source, locale } = parsedInput;

    // Check if email already exists
    const existing = await prisma.emailSubscription.findUnique({
      where: { email },
    });

    if (existing) {
      // If already subscribed, update the source if different
      if (existing.source !== source) {
        await prisma.emailSubscription.update({
          where: { email },
          data: { source, locale },
        });
      }
      return { success: true, message: "already_subscribed" };
    }

    // Create new subscription
    await prisma.emailSubscription.create({
      data: {
        email,
        source,
        locale,
      },
    });

    return { success: true, message: "subscribed" };
  });
