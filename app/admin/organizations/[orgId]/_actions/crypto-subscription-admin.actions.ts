"use server";

import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription/subscription-manager";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { z } from "zod";

const updatePlanSchema = z.object({
  userId: z.string(),
  planName: z.enum(["free", "pro", "ultra"]),
  daysGranted: z.number().int().positive(),
});

const extendSubscriptionSchema = z.object({
  userId: z.string(),
  daysToAdd: z.number().int().positive(),
});

const resetToFreeSchema = z.object({
  userId: z.string(),
});

/**
 * Admin action: Update user's plan
 * Uses the existing activateSubscription() from subscription-manager
 */
export async function updatePlanAction(data: z.infer<typeof updatePlanSchema>) {
  await getRequiredAdmin();

  const { userId, planName, daysGranted } = updatePlanSchema.parse(data);

  // Use the centralized subscription manager
  const result = await activateSubscription({
    userId,
    plan: planName as MyCryptoPilotPlanName,
    daysGranted,
    source: "admin",
  });

  if (!result.success) {
    throw new Error(result.error ?? "Failed to update plan");
  }

  return result;
}

/**
 * Admin action: Extend current subscription by adding days
 */
export async function extendSubscriptionAction(
  data: z.infer<typeof extendSubscriptionSchema>,
) {
  await getRequiredAdmin();

  const { userId, daysToAdd } = extendSubscriptionSchema.parse(data);

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      planName: true,
      planExpiresAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const currentPlan = user.planName ?? "free";

  if (currentPlan === "free") {
    throw new Error(
      "Cannot extend Free plan. Please upgrade to Pro or Ultra first.",
    );
  }

  // Calculate new expiration date
  const now = new Date();
  const currentExpiration = user.planExpiresAt
    ? new Date(user.planExpiresAt)
    : now;

  // If already expired, start from now, otherwise extend from current expiration
  const baseDate = currentExpiration > now ? currentExpiration : now;
  const newExpiration = new Date(baseDate);
  newExpiration.setDate(newExpiration.getDate() + daysToAdd);

  // Update user's expiration date
  await prisma.user.update({
    where: { id: userId },
    data: {
      planExpiresAt: newExpiration,
    },
  });

  // Update subscription record if exists
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      role: "owner",
    },
    select: {
      organizationId: true,
    },
  });

  if (membership) {
    await prisma.subscription.upsert({
      where: {
        referenceId: membership.organizationId,
      },
      create: {
        id: crypto.randomUUID(),
        plan: currentPlan,
        referenceId: membership.organizationId,
        status: "active",
        periodStart: now,
        periodEnd: newExpiration,
        cancelAtPeriodEnd: false,
      },
      update: {
        periodEnd: newExpiration,
        status: "active",
      },
    });
  }

  return {
    success: true,
    newExpiration,
    daysAdded: daysToAdd,
  };
}

/**
 * Admin action: Reset user to Free plan
 */
export async function resetToFreeAction(
  data: z.infer<typeof resetToFreeSchema>,
) {
  await getRequiredAdmin();

  const { userId } = resetToFreeSchema.parse(data);

  // Reset user to free plan
  await prisma.user.update({
    where: { id: userId },
    data: {
      planName: "free",
      planExpiresAt: null,
    },
  });

  // Update subscription record if exists
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      role: "owner",
    },
    select: {
      organizationId: true,
    },
  });

  if (membership) {
    await prisma.subscription.upsert({
      where: {
        referenceId: membership.organizationId,
      },
      create: {
        id: crypto.randomUUID(),
        plan: "free",
        referenceId: membership.organizationId,
        status: "active",
        periodStart: new Date(),
        periodEnd: new Date(),
        cancelAtPeriodEnd: false,
      },
      update: {
        plan: "free",
        status: "active",
        periodEnd: new Date(),
        cancelAtPeriodEnd: false,
      },
    });
  }

  return {
    success: true,
  };
}
