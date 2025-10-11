/**
 * API Route: Generate Crypto Addresses
 *
 * POST /api/crypto/generate-address
 *
 * Generates unique crypto payment addresses for a user:
 * - Base (USDC) address via HD wallet derivation
 * - Tron (USDT) address via HD wallet derivation
 * - Stores addresses in DB (CryptoAddress model)
 * - Returns addresses + expiration timestamp (15 min)
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/34
 */

import { NextResponse } from "next/server";
import { generateCryptoAddress } from "@/lib/crypto/address-generator";
import { getPlanByName } from "@/lib/crypto/mycryptopilot-plans";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const user = await getRequiredUser();
    const { plan } = await request.json();

    // Validate plan
    const planName = plan?.toLowerCase();
    if (planName !== "pro" && planName !== "ultra") {
      return NextResponse.json(
        { error: "Invalid plan parameter. Must be pro or ultra." },
        { status: 400 },
      );
    }

    const planConfig = getPlanByName(planName);

    logger.info("Generating crypto addresses for checkout", {
      userId: user.id,
      plan: planName,
    });

    // Generate addresses for both networks (parallel)
    const [baseAddress, tronAddress] = await Promise.all([
      generateCryptoAddress(user.id, "BASE"),
      generateCryptoAddress(user.id, "TRON"),
    ]);

    // Calculate expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    logger.info("Crypto addresses generated successfully", {
      userId: user.id,
      plan: planName,
      baseAddress: baseAddress.address,
      tronAddress: tronAddress.address,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      addresses: {
        base: {
          id: baseAddress.id,
          address: baseAddress.address,
          network: "BASE",
        },
        tron: {
          id: tronAddress.id,
          address: tronAddress.address,
          network: "TRON",
        },
      },
      plan: {
        name: planConfig.name,
        price: planConfig.priceUSD,
        currency: "USD",
      },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error("Generate address error", { error });
    return NextResponse.json(
      { error: "Failed to generate addresses. Please try again." },
      { status: 500 },
    );
  }
}
