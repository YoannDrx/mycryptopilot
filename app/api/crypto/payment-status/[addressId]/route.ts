/**
 * API Route: Check Payment Status
 *
 * GET /api/crypto/payment-status/[addressId]
 *
 * Polls crypto payment status for a given address:
 * - Calls watchPayment() from payment-watcher.ts
 * - Checks Base (USDC) Transfer events via RPC
 * - Checks Tron (USDT) Transfer events via RPC
 * - Returns status: pending, confirming, confirmed, expired
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/34
 */

import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/cached-get-user";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    addressId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getRequiredUser();
    const { addressId } = context.params;

    // Validate address belongs to user
    const cryptoAddress = await prisma.cryptoAddress.findUnique({
      where: { id: addressId },
    });

    if (!cryptoAddress || cryptoAddress.userId !== user.id) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // TODO: Implement payment status checking
    // 1. Call watchPayment() from payment-watcher.ts
    // 2. Return status + confirmations + tx details

    return NextResponse.json({
      status: "pending",
      message: "Payment watcher not implemented yet (Issue #34)",
    });
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
