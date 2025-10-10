"use server";

import { z } from "zod";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { assignRoleToUser, removeAllRolesFromUser } from "@/lib/discord/roles";
import {
  getPlanByName,
  type MyCryptoPilotPlanName,
} from "@/lib/crypto/mycryptopilot-plans";
import { LinkDiscordSchema, UnlinkDiscordSchema } from "./user.schema";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

/**
 * Action pour lier un Discord ID à l'utilisateur actuel
 *
 * Vérifie:
 * - Que le Discord ID n'est pas déjà utilisé par un autre utilisateur
 * - Assigne automatiquement le rôle Discord correspondant au plan de l'utilisateur
 */
export const linkDiscordAction = authAction
  .inputSchema(LinkDiscordSchema)
  .action(async ({ parsedInput: { discordId }, ctx: { user } }) => {
    // Récupérer l'utilisateur complet avec discordId
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { discordId: true },
    });

    // Vérifier que ce Discord ID n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { discordId },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ActionError(
        "This Discord account is already linked to another user",
      );
    }

    // Si l'utilisateur a déjà ce Discord ID, ne rien faire
    if (currentUser?.discordId === discordId) {
      return {
        success: true,
        message: "Discord account already linked",
      };
    }

    // Mettre à jour l'utilisateur avec le Discord ID
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { discordId },
      select: {
        id: true,
        discordId: true,
        planName: true,
      },
    });

    logger.info(
      `Discord ID ${discordId} linked to user ${user.id} (${user.email})`,
    );

    // Assigner le rôle Discord correspondant au plan de l'utilisateur
    const planName = (updatedUser.planName ?? "free") as MyCryptoPilotPlanName;
    const plan = getPlanByName(planName);

    try {
      const roleAssigned = await assignRoleToUser(discordId, planName);

      if (roleAssigned) {
        logger.info(
          `Assigned Discord role for plan ${planName} to user ${user.id}`,
        );
      } else {
        logger.warn(
          `Failed to assign Discord role for plan ${planName} to user ${user.id}`,
        );
      }
    } catch (error) {
      logger.error("Error assigning Discord role:", error);
      // Ne pas throw d'erreur car le lien a été créé avec succès
      // L'assignation du rôle peut échouer si le bot n'est pas actif
    }

    return {
      success: true,
      message: `Discord account linked successfully! You now have the ${plan.name.toUpperCase()} role.`,
    };
  });

/**
 * Action pour délier un Discord ID de l'utilisateur actuel
 *
 * Retire tous les rôles MyCryptoPilot du compte Discord
 */
export const unlinkDiscordAction = authAction
  .inputSchema(UnlinkDiscordSchema)
  .action(async ({ ctx: { user } }) => {
    // Récupérer l'utilisateur complet avec discordId
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { discordId: true },
    });

    if (!currentUser?.discordId) {
      throw new ActionError("No Discord account linked");
    }

    const discordId = currentUser.discordId;

    // Retirer le Discord ID ET désactiver l'intégration Discord
    // Note: On garde le compte OAuth (table account) pour permettre le login via Discord
    await prisma.user.update({
      where: { id: user.id },
      data: {
        discordId: null,
        discordIntegrationEnabled: false, // Empêche le re-sync automatique
      },
    });

    logger.info(
      `Discord integration disabled for user ${user.id} (${user.email}) - Discord ID ${discordId} unlinked`,
    );

    // Retirer tous les rôles MyCryptoPilot du compte Discord
    try {
      const rolesRemoved = await removeAllRolesFromUser(discordId);

      if (rolesRemoved) {
        logger.info(`Removed Discord roles from user ${user.id}`);
      } else {
        logger.warn(`Failed to remove Discord roles from user ${user.id}`);
      }
    } catch (error) {
      logger.error("Error removing Discord roles:", error);
      // Ne pas throw d'erreur car le lien a été supprimé avec succès
    }

    // Invalider le cache de la page Discord
    revalidatePath("/account/discord");

    return {
      success: true,
      message: "Discord account unlinked successfully",
    };
  });

/**
 * Action pour mettre à jour le rôle Discord d'un utilisateur
 * (Appelée automatiquement après un paiement ou changement de plan)
 */
export const updateDiscordRoleAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    // Récupérer le plan actuel de l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planName: true,
        discordId: true,
      },
    });

    if (!userData?.discordId) {
      throw new ActionError("No Discord account linked");
    }

    const planName = (userData.planName ?? "free") as MyCryptoPilotPlanName;

    // Assigner le rôle Discord correspondant
    const roleAssigned = await assignRoleToUser(userData.discordId, planName);

    if (!roleAssigned) {
      throw new ActionError("Failed to update Discord role");
    }

    logger.info(
      `Updated Discord role for user ${user.id} to ${planName.toUpperCase()}`,
    );

    return {
      success: true,
      message: `Discord role updated to ${planName.toUpperCase()}`,
    };
  });
