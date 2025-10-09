import { logger } from "@/lib/logger";
import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
import { prisma } from "../src/lib/prisma";
import crypto from "crypto";

// Set seed for reproducibility
faker.seed(123);

// Crypto trading symbols
const SYMBOLS = [
  "BTC-USDT",
  "ETH-USDT",
  "SOL-USDT",
  "AVAX-USDT",
  "MATIC-USDT",
  "ARB-USDT",
  "OP-USDT",
];

// Trader profiles data with custom avatars
const TRADER_PROFILES = [
  {
    displayName: "CryptoWhale",
    bio: "Professional Bitcoin trader since 2015. Specialized in macro trends and swing trading. Risk-first approach with 65% win rate.",
    priceMonthlyUSD: 99,
    verified: true,
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoWhale&backgroundColor=b6e3f4",
    stats: {
      winrate: 65.4,
      payoff: 2.1,
      maxDD: 18.5,
      nTrades: 342,
      expectancy: 0.85,
    },
  },
  {
    displayName: "AltcoinMaster",
    bio: "DeFi specialist focusing on Layer 1 and Layer 2 opportunities. Technical analysis combined with on-chain metrics.",
    priceMonthlyUSD: 79,
    verified: true,
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=AltcoinMaster&backgroundColor=c0aede",
    stats: {
      winrate: 58.2,
      payoff: 2.8,
      maxDD: 24.3,
      nTrades: 189,
      expectancy: 0.92,
    },
  },
  {
    displayName: "ScalpKing",
    bio: "High-frequency scalper on perpetual contracts. Quick in & out with tight risk management.",
    priceMonthlyUSD: 149,
    verified: true,
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=ScalpKing&backgroundColor=ffd5dc",
    stats: {
      winrate: 71.5,
      payoff: 1.4,
      maxDD: 12.1,
      nTrades: 892,
      expectancy: 0.68,
    },
  },
  {
    displayName: "SwingTrader_Pro",
    bio: "Mid-term swing trader focusing on major cryptocurrencies. Patient approach, let winners run.",
    priceMonthlyUSD: 69,
    verified: true,
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=SwingTrader&backgroundColor=d1d4f9",
    stats: {
      winrate: 54.8,
      payoff: 3.2,
      maxDD: 28.7,
      nTrades: 156,
      expectancy: 1.12,
    },
  },
  {
    displayName: "DeFiHunter",
    bio: "Specialized in DeFi tokens and emerging protocols. Early mover advantage with solid risk/reward ratios.",
    priceMonthlyUSD: 89,
    verified: false,
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiHunter&backgroundColor=ffdfbf",
    stats: {
      winrate: 48.3,
      payoff: 4.1,
      maxDD: 35.2,
      nTrades: 98,
      expectancy: 1.28,
    },
  },
  {
    displayName: "TechAnalyst",
    bio: "Pure technical analysis trader. Chart patterns, support/resistance, volume analysis. No fundamentals.",
    priceMonthlyUSD: 59,
    verified: true,
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=TechAnalyst&backgroundColor=b6e3f4",
    stats: {
      winrate: 62.1,
      payoff: 1.9,
      maxDD: 19.8,
      nTrades: 267,
      expectancy: 0.79,
    },
  },
];

// Generate realistic trading signal payload
function generateSignalPayload(_symbol: string, _traderStyle: string) {
  const instrumentType = faker.helpers.arrayElement(["SPOT", "PERP"]);
  const bias = faker.helpers.arrayElement(["LONG", "SHORT"]);
  const entry = faker.number.float({ min: 0.5, max: 70000, fractionDigits: 2 });
  const invalidation =
    bias === "LONG"
      ? entry * faker.number.float({ min: 0.85, max: 0.95, fractionDigits: 3 })
      : entry * faker.number.float({ min: 1.05, max: 1.15, fractionDigits: 3 });

  const tps = [
    entry * (bias === "LONG" ? 1.05 : 0.95),
    entry * (bias === "LONG" ? 1.12 : 0.88),
    entry * (bias === "LONG" ? 1.2 : 0.8),
  ].map((tp) => parseFloat(tp.toFixed(2)));

  const rationales = [
    `Strong ${bias === "LONG" ? "support" : "resistance"} zone at ${entry.toFixed(2)}`,
    `${faker.helpers.arrayElement(["RSI", "MACD", "Bollinger Bands"])} showing ${bias === "LONG" ? "bullish" : "bearish"} signals`,
    `Volume profile confirms ${bias === "LONG" ? "accumulation" : "distribution"} pattern`,
  ];

  return {
    instrumentType,
    bias,
    entry,
    invalidation: parseFloat(invalidation.toFixed(2)),
    tps,
    leverageBand:
      instrumentType === "PERP"
        ? faker.helpers.arrayElement(["2-3x", "3-5x", "5-10x"])
        : "1x",
    risk: faker.number.int({ min: 2, max: 4 }),
    confidence: faker.number.int({ min: 65, max: 92 }),
    rationales,
    regime: faker.helpers.arrayElement(["TRENDING", "RANGING", "VOLATILE"]),
    managedBy: faker.helpers.arrayElement(["HUMAN", "AI"]),
    version: "1.0",
  };
}

async function main() {
  logger.info("🌱 Seeding database...");

  // Create 15 users (10 regular + 5 will become traders)
  const userCreatePromises = Array.from({ length: 15 }, async () => {
    const email = faker.internet.email();
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: nanoid(11),
        name: faker.person.fullName(),
        email,
        emailVerified: faker.datatype.boolean(0.8),
        image: faker.image.avatar(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
  });

  const users = await Promise.all(userCreatePromises);
  users.forEach((user) => logger.info(`👤 Created user: ${user.name}`));

  // Create 3 organizations
  const memberPromises: Promise<unknown>[] = [];
  const invitationPromises: Promise<unknown>[] = [];

  const orgData = Array.from({ length: 3 }, () => {
    const orgName = faker.company.name();
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return { orgName, orgSlug };
  });

  const organizations = await Promise.all(
    orgData.map(async ({ orgName, orgSlug }) =>
      prisma.organization
        .upsert({
          where: { slug: orgSlug },
          update: {},
          create: {
            id: nanoid(11),
            name: orgName,
            slug: orgSlug,
            logo: faker.image.url(),
            email: faker.internet.email(),
            createdAt: faker.date.past(),
          },
        })
        .then((org) => {
          logger.info(`🏢 Created organization: ${org.name}`);
          return org;
        }),
    ),
  );

  organizations.forEach((organization) => {
    const roleOptions = ["owner", "admin", "member"];

    memberPromises.push(
      prisma.member
        .create({
          data: {
            id: nanoid(11),
            organizationId: organization.id,
            userId: users[0].id,
            role: "owner",
            createdAt: faker.date.past(),
          },
        })
        .then(() =>
          logger.info(
            `👑 Added ${users[0].name} as OWNER to ${organization.name}`,
          ),
        ),
    );

    const memberCount = faker.number.int({ min: 2, max: 4 });
    const memberIndices = faker.helpers.uniqueArray(
      () => faker.number.int({ min: 1, max: users.length - 1 }),
      memberCount,
    );

    for (const index of memberIndices) {
      const user = users[index];
      const role = faker.helpers.arrayElement(roleOptions);

      memberPromises.push(
        prisma.member
          .create({
            data: {
              id: nanoid(11),
              organizationId: organization.id,
              userId: user.id,
              role,
              createdAt: faker.date.past(),
            },
          })
          .then(() =>
            logger.info(
              `👥 Added ${user.name} as ${role} to ${organization.name}`,
            ),
          ),
      );
    }
  });

  await Promise.all([...memberPromises, ...invitationPromises]);

  // ============================================
  // CREATE TRADER PROFILES
  // ============================================

  logger.info("📊 Creating trader profiles...");

  const traders = await Promise.all(
    TRADER_PROFILES.map(async (profileData, index) => {
      const user = users[index]; // Use first 6 users as traders

      // Update user with custom avatar
      await prisma.user.update({
        where: { id: user.id },
        data: { image: profileData.avatar },
      });

      const traderProfile = await prisma.traderProfile.create({
        data: {
          userId: user.id,
          displayName: profileData.displayName,
          bio: profileData.bio,
          priceMonthlyUSD: profileData.priceMonthlyUSD,
          statsJson: profileData.stats,
          verified: profileData.verified,
          verifiedAt: profileData.verified ? faker.date.past() : null,
        },
      });

      logger.info(
        `🎯 Created trader: ${profileData.displayName} (${user.name})`,
      );
      return { ...traderProfile, user: { ...user, image: profileData.avatar } };
    }),
  );

  // ============================================
  // CREATE TRADING SIGNALS
  // ============================================

  logger.info("📡 Creating trading signals...");

  const signalPromises = traders.flatMap((trader) => {
    // Each trader creates 3-8 signals
    const signalCount = faker.number.int({ min: 3, max: 8 });

    return Array.from({ length: signalCount }, async () => {
      const symbol = faker.helpers.arrayElement(SYMBOLS);
      const payloadJson = generateSignalPayload(symbol, trader.displayName);
      const ttlSec = faker.number.int({ min: 3600, max: 86400 }); // 1h to 24h
      const createdAt = faker.date.recent({ days: 7 });
      const expiresAt = new Date(createdAt.getTime() + ttlSec * 1000);

      // Generate hash for signal integrity
      const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(payloadJson) + trader.user.id + Date.now())
        .digest("hex");

      const signal = await prisma.signal.create({
        data: {
          traderId: trader.user.id,
          symbol,
          payloadJson,
          ttlSec,
          hash,
          createdAt,
          expiresAt,
        },
      });

      logger.info(
        `📈 Created signal: ${symbol} ${payloadJson.bias} by ${trader.displayName}`,
      );
      return signal;
    });
  });

  await Promise.all(signalPromises);

  // ============================================
  // CREATE FOLLOWS
  // ============================================

  logger.info("🔗 Creating follow relationships...");

  const followPromises = users.slice(6).map(async (follower) => {
    // Each non-trader user follows 1-3 random traders
    const followCount = faker.number.int({ min: 1, max: 3 });
    const followedTraders = faker.helpers.arrayElements(traders, followCount);

    return Promise.all(
      followedTraders.map(async (trader) => {
        const follow = await prisma.follow.create({
          data: {
            userId: follower.id,
            traderId: trader.user.id,
            status: "ACTIVE",
            startedAt: faker.date.past(),
            expiresAt: faker.date.future(),
          },
        });

        logger.info(`💫 ${follower.name} follows ${trader.displayName}`);
        return follow;
      }),
    );
  });

  await Promise.all(followPromises);

  logger.info("✅ Seeding completed!");
  logger.info(`📊 Summary:`);
  logger.info(`  - ${users.length} users created`);
  logger.info(`  - ${traders.length} trader profiles created`);
  logger.info(`  - ${signalPromises.length} signals created`);
  logger.info(`  - ${followPromises.length * 2} follow relationships created`);
}

main()
  .catch((e) => {
    logger.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
