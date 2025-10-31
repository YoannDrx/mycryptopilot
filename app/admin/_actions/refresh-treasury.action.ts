"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Action serveur pour rafraîchir les données de trésorerie
 *
 * Cette action:
 * 1. Vérifie que l'utilisateur est admin
 * 2. Force le revalidate du cache Next.js pour la page /admin
 * 3. Retourne un succès
 *
 * Utilisée par le bouton de refresh manuel dans TreasuryCard.
 */
export const refreshTreasuryAction = authAction
  .inputSchema(z.object({}))
  .action(async () => {
    // Vérifier que l'utilisateur est admin
    await getRequiredAdmin();

    // Force le re-fetch des données de la page admin
    revalidatePath("/admin");

    return { success: true, timestamp: new Date() };
  });
