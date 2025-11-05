/**
 * API Route: Get User Exchange Balances (Risk Console Feature)
 *
 * GET /api/exchange/balances
 *
 * Fetches live USDT balance from user's connected exchanges (Binance/Bybit).
 * Used by Risk Console to auto-fill capital from exchange accounts.
 *
 * Features:
 * - Requires authenticated user (not trader profile)
 * - Fetches balances in parallel from all active connections
 * - Returns available USDT balance for each exchange
 * - Handles errors gracefully (returns inactive status)
 *
 * Security:
 * - API keys are decrypted on-the-fly (not stored in response)
 * - Only returns balance data (no sensitive info)
 * - User can only see their own balances
 */

import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { getUserExchangeBalances } from "@/features/exchange/exchange-queries";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getRequiredUser();

    logger.info("Fetching exchange balances for Risk Console", {
      userId: user.id,
    });

    // Fetch balances from all connected exchanges
    const balances = await getUserExchangeBalances(user.id);

    logger.info("Exchange balances fetched successfully", {
      userId: user.id,
      exchangeCount: balances.length,
      activeCount: balances.filter((b) => b.isActive).length,
    });

    return NextResponse.json({
      success: true,
      balances,
    });
  } catch (error) {
    logger.error("Failed to fetch exchange balances", { error });

    // Return empty array on error (Risk Console can still work with manual input)
    return NextResponse.json({
      success: false,
      balances: [],
      error: "Failed to fetch exchange balances",
    });
  }
}
