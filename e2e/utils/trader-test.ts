import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { createTestAccount } from "./auth-test";

/**
 * Helper function to create a test trader with a complete profile
 */
export async function createTestTrader(options: {
  page: Page;
  initialUserData?: { name: string; email: string; password: string };
}) {
  // Create a test account
  const userData = await createTestAccount({
    page: options.page,
    callbackURL: "/orgs",
    initialUserData: options.initialUserData,
  });

  // Wait for URL to settle
  await options.page.waitForURL(/\/orgs\/.*/);

  // Get user from database
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: userData.email },
  });

  // Create trader profile directly in database
  const traderProfile = await prisma.traderProfile.create({
    data: {
      userId: user.id,
      displayName: `${faker.person.firstName()} Trader`,
      bio: faker.lorem.sentence(),
      verified: false,
      statsJson: {
        winrate: faker.number.float({ min: 50, max: 85, fractionDigits: 1 }),
        payoff: faker.number.float({ min: 1.5, max: 3.5, fractionDigits: 1 }),
        totalTrades: faker.number.int({ min: 50, max: 500 }),
      },
    },
  });

  return {
    userData,
    user,
    traderProfile,
  };
}

/**
 * Helper function to create a test signal for a trader
 */
export async function createTestSignal(options: {
  traderId: string;
  expired?: boolean;
  symbol?: string;
}) {
  const symbol = options.symbol ?? `${faker.finance.currencyCode()}USDT`;
  const createdAt = new Date();

  // If expired, set TTL to negative value so expiresAt is in the past
  const ttlSec = options.expired ? -3600 : 86400; // -1h or +24h
  const expiresAt = new Date(createdAt.getTime() + ttlSec * 1000);

  // Generate payload matching TradingCardPayloadSchema
  const entry = faker.number.float({
    min: 40000,
    max: 50000,
    fractionDigits: 2,
  });
  const payload = {
    instrumentType: faker.helpers.arrayElement(["SPOT", "PERP"]) as
      | "SPOT"
      | "PERP",
    bias: faker.helpers.arrayElement(["LONG", "SHORT"]) as "LONG" | "SHORT",
    entry,
    invalidation: faker.number.float({
      min: entry * 0.9,
      max: entry * 0.95,
      fractionDigits: 2,
    }),
    tps: [
      faker.number.float({
        min: entry * 1.05,
        max: entry * 1.1,
        fractionDigits: 2,
      }),
      faker.number.float({
        min: entry * 1.1,
        max: entry * 1.15,
        fractionDigits: 2,
      }),
      faker.number.float({
        min: entry * 1.15,
        max: entry * 1.2,
        fractionDigits: 2,
      }),
    ],
    leverageBand: `${faker.number.int({ min: 1, max: 3 })}-${faker.number.int({ min: 5, max: 10 })}x`,
    risk: faker.number.int({ min: 1, max: 5 }),
    confidence: faker.number.int({ min: 60, max: 95 }),
    rationales: [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
    ],
    regime: faker.helpers.arrayElement(["Bull", "Bear", "Ranging", "Volatile"]),
    managedBy: faker.helpers.arrayElement(["AI", "HUMAN"]) as "AI" | "HUMAN",
    version: "1.0",
  };

  // Generate hash
  const { createHash } = await import("crypto");
  const hashData = `${options.traderId}|${symbol}|${JSON.stringify(payload)}|${createdAt.toISOString()}`;
  const hash = createHash("sha256").update(hashData).digest("hex");

  const signal = await prisma.signal.create({
    data: {
      traderId: options.traderId,
      symbol,
      payloadJson: payload,
      ttlSec: Math.abs(ttlSec),
      hash,
      createdAt,
      expiresAt,
    },
  });

  return signal;
}
