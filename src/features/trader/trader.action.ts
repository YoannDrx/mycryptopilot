"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import {
  checkUserHasTraderProfile,
  getTraderProfileByUserId,
  getUserWithTraderProfile,
} from "./trader-queries";
import {
  CreateTraderProfileSchema,
  ToggleTraderRoleSchema,
  UpdateTraderProfileSchema,
} from "./trader.schema";

/**
 * Action pour créer un profil trader
 *
 * Vérifie qu'un profil n'existe pas déjà pour cet utilisateur
 * Crée le profil et met à jour le rôle user (USER → TRADER ou TRADER → BOTH)
 */
export const createTraderProfileAction = authAction
  .inputSchema(CreateTraderProfileSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Vérifier qu'un profil n'existe pas déjà
    const existingProfile = await checkUserHasTraderProfile(user.id);

    if (existingProfile) {
      throw new ActionError("You already have a trader profile");
    }

    // Récupérer le user complet avec userRole depuis Prisma
    const fullUser = await getUserWithTraderProfile(user.id);

    if (!fullUser) {
      throw new ActionError("User not found");
    }

    // Créer le profil trader
    const traderProfile = await prisma.traderProfile.create({
      data: {
        userId: user.id,
        displayName: parsedInput.displayName,
        bio: parsedInput.bio,
        priceMonthlyUSD: parsedInput.priceMonthlyUSD || 0,
      },
    });

    // Mettre à jour le rôle utilisateur
    // Si USER → TRADER, si déjà autre chose → BOTH
    const newRole = fullUser.userRole === "USER" ? "TRADER" : "BOTH";

    await prisma.user.update({
      where: { id: user.id },
      data: { userRole: newRole },
    });

    return {
      traderProfile,
      newRole,
    };
  });

/**
 * Action pour mettre à jour un profil trader
 *
 * Vérifie que le profil appartient bien à l'utilisateur courant
 */
export const updateTraderProfileAction = authAction
  .inputSchema(UpdateTraderProfileSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Vérifier que le profil existe et appartient à l'utilisateur
    const existingProfile = await getTraderProfileByUserId(user.id);

    if (!existingProfile) {
      throw new ActionError(
        "You don't have a trader profile. Create one first.",
      );
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.traderProfile.update({
      where: { userId: user.id },
      data: {
        displayName: parsedInput.displayName,
        bio: parsedInput.bio,
        priceMonthlyUSD: parsedInput.priceMonthlyUSD,
      },
    });

    return updatedProfile;
  });

/**
 * Action pour activer/désactiver le mode trader
 *
 * Si enabled = true:
 *   - Vérifie qu'un profil trader existe
 *   - Met userRole à TRADER ou BOTH
 *
 * Si enabled = false:
 *   - Met userRole à USER
 *   - Ne supprime PAS le profil (garde l'historique)
 */
export const toggleTraderRoleAction = authAction
  .inputSchema(ToggleTraderRoleSchema)
  .action(async ({ parsedInput: { enabled }, ctx: { user } }) => {
    // Récupérer le user complet avec userRole
    const fullUser = await getUserWithTraderProfile(user.id);

    if (!fullUser) {
      throw new ActionError("User not found");
    }

    if (enabled) {
      // Activer le mode trader
      // Vérifier qu'un profil trader existe
      const hasProfile = await checkUserHasTraderProfile(user.id);

      if (!hasProfile) {
        throw new ActionError(
          "You need to create a trader profile first. Go to /account/become-trader",
        );
      }

      // Update role to TRADER or BOTH
      const newRole = fullUser.userRole === "USER" ? "TRADER" : "BOTH";

      await prisma.user.update({
        where: { id: user.id },
        data: { userRole: newRole },
      });

      return { enabled: true, newRole };
    } else {
      // Désactiver le mode trader
      // Set role to USER (garde le profil trader pour historique)
      await prisma.user.update({
        where: { id: user.id },
        data: { userRole: "USER" },
      });

      return { enabled: false, newRole: "USER" };
    }
  });
