import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * GET /api/crypto/payment-status/:addressId
 *
 * Vérifie le statut d'un paiement crypto pour une adresse donnée.
 * Retourne le statut du paiement le plus récent associé à cette adresse.
 *
 * @param addressId - ID de l'adresse crypto
 * @returns { status: "PENDING" | "CONFIRMED" | "EXPIRED", payment?: {...} }
 */
export const GET = route
  .params(
    z.object({
      addressId: z.string(),
    }),
  )
  .handler(async (req, { params }) => {
    const user = await getRequiredUser();
    const { addressId } = params;

    logger.info("Checking payment status", {
      userId: user.id,
      addressId,
    });

    try {
      // Vérifier que l'adresse appartient bien à cet utilisateur
      const cryptoAddress = await prisma.cryptoAddress.findFirst({
        where: {
          id: addressId,
          userId: user.id,
        },
      });

      if (!cryptoAddress) {
        logger.warn("Crypto address not found or unauthorized", {
          userId: user.id,
          addressId,
        });

        return {
          status: "NOT_FOUND",
          error: "Address not found or unauthorized",
        };
      }

      // Chercher le paiement le plus récent pour cette adresse
      const payment = await prisma.cryptoPayment.findFirst({
        where: {
          addressId: cryptoAddress.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          txHash: true,
          status: true,
          amountUSD: true,
          confirmations: true,
          confirmedAt: true,
          plan: true,
          daysGranted: true,
          createdAt: true,
        },
      });

      if (!payment) {
        // Aucun paiement détecté pour cette adresse
        return {
          status: "PENDING",
          message: "Waiting for payment...",
        };
      }

      // Paiement trouvé, retourner son statut
      return {
        status: payment.status,
        payment: {
          id: payment.id,
          txHash: payment.txHash,
          amountUSD: payment.amountUSD,
          confirmations: payment.confirmations,
          confirmedAt: payment.confirmedAt,
          plan: payment.plan,
          daysGranted: payment.daysGranted,
          createdAt: payment.createdAt,
        },
      };
    } catch (error) {
      logger.error("Failed to check payment status", {
        userId: user.id,
        addressId,
        error,
      });

      return {
        status: "ERROR",
        error: "Failed to check payment status",
      };
    }
  });
