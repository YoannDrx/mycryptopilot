import { generateCryptoAddress } from "@/lib/crypto/address-generator";
import { logger } from "@/lib/logger";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { route } from "@/lib/zod-route";
import { z } from "zod";

/**
 * POST /api/crypto/generate-address
 *
 * Génère une adresse crypto unique pour un utilisateur sur un réseau spécifique.
 * Si l'utilisateur a déjà une adresse active pour ce réseau, elle est retournée.
 *
 * @body { network: "BASE" | "TRON", plan: "pro" | "ultra" }
 * @returns { address: string, network: string, qrData: string }
 */
export const POST = route
  .body(
    z.object({
      network: z.enum(["BASE", "TRON"]),
      plan: z.enum(["pro", "ultra"]),
    }),
  )
  .handler(async (req, { body }) => {
    const user = await getRequiredUser();

    logger.info("Generating crypto address for payment", {
      userId: user.id,
      network: body.network,
      plan: body.plan,
    });

    try {
      // Générer ou récupérer l'adresse crypto
      const cryptoAddress = await generateCryptoAddress(user.id, body.network);

      logger.info("Crypto address generated successfully", {
        userId: user.id,
        addressId: cryptoAddress.id,
        network: body.network,
      });

      // QR data: format standard pour wallets (address:amount)
      // Pour USDC/USDT, on pourrait utiliser EIP-681 (ethereum:address@chainId?value=...)
      // Mais la plupart des wallets scannent juste l'adresse
      const qrData = cryptoAddress.address;

      return {
        addressId: cryptoAddress.id,
        address: cryptoAddress.address,
        network: body.network,
        qrData,
      };
    } catch (error) {
      logger.error("Failed to generate crypto address", {
        userId: user.id,
        network: body.network,
        error,
      });

      throw new Error(
        "Failed to generate crypto address. Please try again or contact support.",
      );
    }
  });
