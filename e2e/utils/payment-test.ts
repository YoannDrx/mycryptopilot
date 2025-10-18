import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription/subscription-manager";
import { calculateDaysGranted } from "@/lib/crypto/mycryptopilot-plans";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Helper to mock a crypto payment and activate subscription
 *
 * Simule le flow complet:
 * 1. Crée une CryptoAddress pour le user
 * 2. Crée un CryptoPayment avec status CONFIRMED
 * 3. Appelle activateSubscription() pour activer le plan
 * 4. Retourne le payment et la subscription
 *
 * Usage:
 * ```ts
 * const { payment, subscription } = await mockCryptoPayment({
 *   userId: user.id,
 *   plan: "pro",
 *   amountUSD: 49
 * });
 * ```
 */
export async function mockCryptoPayment(options: {
  userId: string;
  plan: MyCryptoPilotPlanName;
  amountUSD: number;
  network?: "BASE" | "TRON";
  currency?: "USDC" | "USDT";
}) {
  const {
    userId,
    plan,
    amountUSD,
    network = "BASE",
    currency = "USDC",
  } = options;

  // 1. Create CryptoAddress for user
  const address = await prisma.cryptoAddress.create({
    data: {
      userId,
      network,
      address:
        network === "BASE"
          ? `0x${Math.random().toString(16).substring(2, 42)}` // Mock Ethereum address
          : `T${Math.random().toString(16).substring(2, 35)}`, // Mock Tron address
      derivationPath: `m/44'/60'/0'/0/${Math.floor(Math.random() * 1000)}`,
      isActive: true,
    },
  });

  // 2. Calculate days granted based on amount and plan
  const daysGranted = calculateDaysGranted(amountUSD, plan);

  // 3. Create CryptoPayment with status CONFIRMED
  const payment = await prisma.cryptoPayment.create({
    data: {
      userId,
      addressId: address.id,
      txHash: `0x${Math.random().toString(16).substring(2)}`, // Mock tx hash
      amountToken: amountUSD, // For tests, we use same value for token and USD
      amountUSD,
      currency,
      network,
      confirmations: network === "BASE" ? 1 : 2, // BASE needs 1, TRON needs 2
      status: "CONFIRMED",
      confirmedAt: new Date(),
      plan,
      daysGranted,
    },
  });

  // 4. Activate subscription
  const result = await activateSubscription({
    userId,
    plan,
    daysGranted,
    source: "crypto_payment",
  });

  if (!result.success) {
    throw new Error(
      `Failed to activate subscription: ${result.error ?? "Unknown error"}`,
    );
  }

  // 5. Get the created/updated subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      organization: {
        members: {
          some: {
            userId,
            role: "owner",
          },
        },
      },
    },
  });

  return {
    payment,
    subscription,
    address,
    daysGranted,
  };
}

/**
 * Helper to upgrade a user to a specific plan without going through payment flow
 *
 * Utile pour setup tests rapides sans simuler tout le payment flow
 *
 * Usage:
 * ```ts
 * await upgradeUserToPlan({ userId: user.id, plan: "pro" });
 * ```
 */
export async function upgradeUserToPlan(options: {
  userId: string;
  plan: MyCryptoPilotPlanName;
  daysGranted?: number;
}) {
  const { userId, plan, daysGranted = 30 } = options;

  const result = await activateSubscription({
    userId,
    plan,
    daysGranted,
    source: "admin", // Simulate admin upgrade
  });

  if (!result.success) {
    throw new Error(
      `Failed to upgrade user to ${plan}: ${result.error ?? "Unknown error"}`,
    );
  }

  // Verify user plan was updated
  const updatedUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      planName: true,
      planExpiresAt: true,
    },
  });

  return {
    planName: updatedUser.planName,
    planExpiresAt: updatedUser.planExpiresAt,
  };
}
