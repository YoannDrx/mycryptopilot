"use server";

import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription/subscription-manager";
import { assignRoleToUser } from "@/lib/discord/roles";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { revalidatePath } from "next/cache";

const updateUserPlanSchema = z.object({
  userId: z.string(),
  plan: z.enum(["free", "pro", "ultra"]),
  daysGranted: z.number().int().positive(),
});

const extendUserSubscriptionSchema = z.object({
  userId: z.string(),
  daysToAdd: z.number().int().positive(),
});

const resetUserToFreeSchema = z.object({
  userId: z.string(),
});

/**
 * Admin action: Update user plan
 *
 * Change le plan d'un utilisateur et accorde des jours
 * Utilise activateSubscription() pour gérer Discord roles + email
 */
export async function updateUserPlanAction(
  data: z.infer<typeof updateUserPlanSchema>,
) {
  await getRequiredAdmin();

  const { userId, plan, daysGranted } = updateUserPlanSchema.parse(data);

  logger.info("[ADMIN] Updating user plan", { userId, plan, daysGranted });

  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return {
      success: false,
      error: "User not found",
    };
  }

  // Utiliser activateSubscription qui gère tout (DB + Discord + Email)
  const result = await activateSubscription({
    userId,
    plan: plan as MyCryptoPilotPlanName,
    daysGranted,
    source: "admin",
  });

  if (result.success) {
    // Revalider les pages admin et utilisateur
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    logger.info("[ADMIN] User plan updated successfully", {
      userId,
      plan,
      periodEnd: result.periodEnd,
    });
  }

  return result;
}

/**
 * Admin action: Extend user subscription
 *
 * Ajoute des jours à l'abonnement existant
 * Garde le plan actuel
 */
export async function extendUserSubscriptionAction(
  data: z.infer<typeof extendUserSubscriptionSchema>,
) {
  await getRequiredAdmin();

  const { userId, daysToAdd } = extendUserSubscriptionSchema.parse(data);

  logger.info("[ADMIN] Extending user subscription", { userId, daysToAdd });

  // Récupérer le plan actuel
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      planName: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: "User not found",
    };
  }

  const currentPlan = (user.planName ?? "free") as MyCryptoPilotPlanName;

  // Utiliser activateSubscription qui gère l'extension automatiquement
  const result = await activateSubscription({
    userId,
    plan: currentPlan,
    daysGranted: daysToAdd,
    source: "admin",
  });

  if (result.success) {
    // Revalider les pages admin et utilisateur
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    logger.info("[ADMIN] User subscription extended successfully", {
      userId,
      daysToAdd,
      periodEnd: result.periodEnd,
    });
  }

  return result;
}

/**
 * Admin action: Reset user to FREE plan
 *
 * Downgrade immédiat vers FREE (équivalent à un cancel)
 * Retire Discord role premium
 */
export async function resetUserToFreeAction(
  data: z.infer<typeof resetUserToFreeSchema>,
) {
  await getRequiredAdmin();

  const { userId } = resetUserToFreeSchema.parse(data);

  logger.info("[ADMIN] Resetting user to FREE plan", { userId });

  try {
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        discordId: true,
        planName: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update vers FREE
    await prisma.user.update({
      where: { id: userId },
      data: {
        planName: "free",
        planExpiresAt: null,
      },
    });

    // Update UserSubscription status
    await prisma.userSubscription.updateMany({
      where: { userId },
      data: {
        status: "canceled",
      },
    });

    logger.info("[ADMIN] User reset to FREE", { userId });

    // Assigner rôle Discord FREE (non-bloquant)
    if (user.discordId) {
      void assignRoleToUser(user.discordId, "free").catch((err) => {
        logger.error("[ADMIN] Error assigning FREE Discord role", {
          userId,
          err,
        });
      });
    }

    // Revalider les pages admin et utilisateur
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    logger.info("[ADMIN] User reset to FREE successfully", { userId });

    return {
      success: true,
      message: "User reset to FREE plan",
    };
  } catch (error) {
    logger.error("[ADMIN] Error resetting user to FREE", { userId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
