import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { createTestAccount } from "./auth-test";
import { retry } from "./retry";
import { randomUUID } from "crypto";

/**
 * Helper function to create a test trader directly in database (faster, no UI interaction)
 * Use this when you need multiple traders and don't need to test the signup flow
 */
export async function createTestTraderDirectly() {
  const email = faker.internet.email().toLowerCase();
  const name = faker.person.firstName();
  const now = new Date();

  // Create user directly in DB
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name,
      emailVerified: false,
      planName: "free",
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create trader profile
  const traderProfile = await prisma.traderProfile.create({
    data: {
      userId: user.id,
      displayName: `${name} Trader`,
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
    user,
    traderProfile,
  };
}

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
    callbackURL: "/dashboard",
    initialUserData: options.initialUserData,
  });

  // Wait for URL to settle (B2C: root-level routes, no /orgs prefix)
  await options.page.waitForURL(/\/dashboard/);

  // Get user from database (with retry to handle DB transaction timing)
  const user = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
      }),
    {
      maxAttempts: 5,
      delayMs: 1000,
      backoff: true,
    },
  );

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
  bias?: string;
  rationale?: string;
}) {
  const symbol = options.symbol ?? `${faker.finance.currencyCode()}USDT`;
  const createdAt = new Date();

  // If expired, set TTL to negative value so expiresAt is in the past
  const ttlSec = options.expired ? -3600 : 86400; // -1h or +24h
  const expiresAt = new Date(createdAt.getTime() + ttlSec * 1000);

  const payload = {
    symbol,
    bias: options.bias ?? faker.helpers.arrayElement(["LONG", "SHORT"]),
    entry: faker.number.float({ min: 1, max: 100 }).toString(),
    tps: [
      faker.number.float({ min: 1, max: 100 }).toString(),
      faker.number.float({ min: 1, max: 100 }).toString(),
    ],
    sl: faker.number.float({ min: 1, max: 100 }).toString(),
    leverage: faker.number.int({ min: 1, max: 20 }).toString(),
    timeframe: faker.helpers.arrayElement(["1H", "4H", "1D"]),
    instrumentType: "PERP",
    riskLevel: faker.number.int({ min: 1, max: 5 }),
    rationales: [options.rationale ?? faker.lorem.sentence()],
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
