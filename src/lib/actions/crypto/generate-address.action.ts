"use server";

/**
 * Server Action: Generate Crypto Payment Addresses
 *
 * Generates unique crypto addresses for checkout payment:
 * - Base (USDC) address for Ethereum L2 payments
 * - Tron (USDT) address for Tron TRC-20 payments
 *
 * Used by: /checkout/[plan] page
 * Related: Issue #34
 */

import { authAction } from "@/lib/actions/safe-actions";
import { generateCryptoAddress } from "@/lib/crypto/address-generator";
import { getPlanByName } from "@/lib/crypto/mycryptopilot-plans";
import { logger } from "@/lib/logger";
import { z } from "zod";

const GenerateAddressSchema = z.object({
  plan: z.enum(["test", "pro", "ultra"]),
});

export const generateAddressAction = authAction
  .schema(GenerateAddressSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { plan } = parsedInput;
    const userId = ctx.user.id;

    logger.info("Generating crypto addresses for checkout", { userId, plan });

    // Get plan config (always returns a valid plan or throws)
    const planConfig = getPlanByName(plan);

    // Generate addresses for both networks (parallel)
    const [baseAddress, tronAddress] = await Promise.all([
      generateCryptoAddress(userId, "BASE"),
      generateCryptoAddress(userId, "TRON"),
    ]);

    // Calculate expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    logger.info("Crypto addresses generated successfully", {
      userId,
      plan,
      baseAddress: baseAddress.address,
      tronAddress: tronAddress.address,
      expiresAt,
    });

    return {
      success: true,
      addresses: {
        base: {
          id: baseAddress.id,
          address: baseAddress.address,
          network: "BASE" as const,
        },
        tron: {
          id: tronAddress.id,
          address: tronAddress.address,
          network: "TRON" as const,
        },
      },
      plan: {
        name: planConfig.name,
        price: planConfig.priceUSD,
        currency: "USD" as const,
      },
      expiresAt: expiresAt.toISOString(),
    };
  });
