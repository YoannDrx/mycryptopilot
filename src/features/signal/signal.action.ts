"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { notifyNewSignal } from "@/lib/discord/webhook";
import { logger } from "@/lib/logger";
import { checkUserHasTraderProfile } from "../trader/trader-queries";
import { signalHashExists } from "./signal-queries";
import { CreateSignalSchema } from "./signal.schema";

/**
 * Génère un hash SHA256 pour un signal
 *
 * Le hash garantit l'intégrité et l'immutabilité du signal
 * Hash = SHA256(traderId + symbol + JSON.stringify(payload) + createdAt)
 */
function generateSignalHash(
  traderId: string,
  symbol: string,
  payload: object,
  createdAt: Date,
): string {
  const data = `${traderId}|${symbol}|${JSON.stringify(payload)}|${createdAt.toISOString()}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Action pour créer un signal de trading
 *
 * Vérifie que:
 * - L'utilisateur a un profil trader
 * - Le hash n'existe pas déjà (éviter doublons)
 *
 * Génère:
 * - Hash SHA256 pour intégrité
 * - expiresAt = createdAt + ttlSec
 */
export const createSignalAction = authAction
  .inputSchema(CreateSignalSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    // Vérifier que l'utilisateur est un trader
    const hasTraderProfile = await checkUserHasTraderProfile(user.id);

    if (!hasTraderProfile) {
      throw new ActionError(
        "You need to create a trader profile first. Go to /account/become-trader",
      );
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + parsedInput.ttlSec * 1000);

    // Générer le hash
    const hash = generateSignalHash(
      user.id,
      parsedInput.symbol,
      parsedInput.payload,
      createdAt,
    );

    // Vérifier que le hash n'existe pas déjà
    const hashExists = await signalHashExists(hash);

    if (hashExists) {
      throw new ActionError(
        "This signal already exists (duplicate hash). Please wait a moment before creating the same signal.",
      );
    }

    // Créer le signal
    const signal = await prisma.signal.create({
      data: {
        traderId: user.id,
        symbol: parsedInput.symbol,
        payloadJson: parsedInput.payload,
        ttlSec: parsedInput.ttlSec,
        hash,
        createdAt,
        expiresAt,
      },
      include: {
        trader: {
          select: {
            id: true,
            name: true,
            image: true,
            traderProfile: {
              select: {
                displayName: true,
                verified: true,
              },
            },
          },
        },
      },
    });

    // Notifier Discord (ne pas bloquer en cas d'erreur)
    try {
      await notifyNewSignal(signal);
      logger.info(`Discord notification sent for signal ${signal.id}`);
    } catch (error) {
      logger.error(
        `Failed to send Discord notification for signal ${signal.id}:`,
        error,
      );
      // Ne pas throw d'erreur car le signal a été créé avec succès
    }

    return signal;
  });
