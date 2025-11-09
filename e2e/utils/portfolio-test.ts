import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";

/**
 * Helper to create a mock ExchangeConnection in database
 * This simulates a connected Binance exchange with encrypted keys
 */
export async function createMockExchangeConnection(options: {
  traderProfileId: string;
  isActive?: boolean;
}) {
  const now = new Date();

  // Create mock encrypted keys (in real app, these are AES-256-GCM encrypted)
  // For tests, we just use base64 encoded mock strings
  const mockApiKey = Buffer.from("mock-api-key-12345678").toString("base64");
  const mockSecretKey = Buffer.from("mock-secret-key-87654321").toString(
    "base64",
  );
  const mockIv = faker.string.alphanumeric(32);
  const mockTag = faker.string.alphanumeric(32);

  const connection = await prisma.exchangeConnection.create({
    data: {
      traderProfileId: options.traderProfileId,
      exchange: "BINANCE",
      encryptedApiKey: mockApiKey,
      encryptedSecretKey: mockSecretKey,
      keyIv: mockIv,
      keyTag: mockTag,
      isActive: options.isActive ?? true,
      lastSyncedAt: now,
      nextSyncAt: new Date(now.getTime() + 5 * 60 * 1000), // +5 minutes
      createdAt: now,
      updatedAt: now,
    },
  });

  // ✅ FIX: Update traderProfile.verified when connecting first exchange
  // This ensures tests that check verification badge work correctly
  await prisma.traderProfile.update({
    where: { id: options.traderProfileId },
    data: { verified: true, verifiedAt: now },
  });

  return connection;
}

/**
 * Helper to create mock ExchangeTrades for a connection
 * Simulates trades fetched from Binance API
 */
export async function createMockExchangeTrades(options: {
  connectionId: string;
  count?: number;
  profitable?: boolean; // Force trades to be profitable/unprofitable
}) {
  const count = options.count ?? 10;
  const trades = [];

  for (let i = 0; i < count; i++) {
    const executedAt = new Date(Date.now() - i * 3600000); // Each trade 1 hour apart
    const symbol = faker.helpers.arrayElement([
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
    ]);
    const side = faker.helpers.arrayElement(["BUY", "SELL"]) as "BUY" | "SELL";
    const quantity = faker.number.float({
      min: 0.01,
      max: 1,
      fractionDigits: 4,
    });
    const price = faker.number.float({
      min: 100,
      max: 50000,
      fractionDigits: 2,
    });

    // Generate realistic PnL
    let realizedPnl: number;
    if (options.profitable === true) {
      realizedPnl = faker.number.float({
        min: 10,
        max: 500,
        fractionDigits: 2,
      });
    } else if (options.profitable === false) {
      realizedPnl = -faker.number.float({
        min: 10,
        max: 200,
        fractionDigits: 2,
      });
    } else {
      // Random mix of wins and losses
      realizedPnl =
        faker.helpers.arrayElement([1, -1]) *
        faker.number.float({ min: 10, max: 300, fractionDigits: 2 });
    }

    trades.push({
      connectionId: options.connectionId,
      externalOrderId: `${faker.number.int({ min: 1000000, max: 9999999 })}`,
      symbol,
      side,
      type: "MARKET" as const,
      executedAt,
      quantity,
      price,
      quoteQuantity: quantity * price,
      realizedPnl,
      fee: faker.number.float({
        min: 0.01,
        max: 5,
        fractionDigits: 2,
      }),
      feeAsset: "USDT",
    });
  }

  // Create all trades at once to avoid await in loop
  const createdTrades = await prisma.exchangeTrade.createManyAndReturn({
    data: trades,
  });

  return createdTrades;
}

/**
 * Helper to create a mock TraderPerformanceSnapshot
 * Simulates calculated performance metrics
 */
export async function createMockPerformanceSnapshot(options: {
  traderProfileId: string;
  period: "ALL_TIME" | "LAST_30D" | "LAST_90D" | "LAST_365D";
  winrate?: number;
  profitFactor?: number;
  netPnl?: number;
}) {
  // Generate realistic performance metrics
  const winrate =
    options.winrate ??
    faker.number.float({ min: 45, max: 75, fractionDigits: 2 });
  const profitFactor =
    options.profitFactor ??
    faker.number.float({ min: 1.2, max: 3.5, fractionDigits: 2 });
  const netPnl =
    options.netPnl ??
    faker.number.float({ min: -1000, max: 5000, fractionDigits: 2 });

  const totalTrades = faker.number.int({ min: 50, max: 200 });
  const winningTrades = Math.floor((totalTrades * winrate) / 100);
  const losingTrades = totalTrades - winningTrades;

  const totalProfits = faker.number.float({
    min: 1000,
    max: 10000,
    fractionDigits: 2,
  });
  const totalLosses = faker.number.float({
    min: 500,
    max: 5000,
    fractionDigits: 2,
  });
  const averageWin =
    winningTrades > 0
      ? faker.number.float({ min: 50, max: 200, fractionDigits: 2 })
      : 0;
  const averageLoss =
    losingTrades > 0
      ? faker.number.float({ min: 30, max: 150, fractionDigits: 2 })
      : 0;

  const snapshot = await prisma.traderPerformanceSnapshot.create({
    data: {
      traderProfileId: options.traderProfileId,
      period: options.period,
      winrate,
      profitFactor,
      netPnl,
      totalTrades,
      winningTrades,
      losingTrades,
      totalProfits,
      totalLosses,
      averageWin,
      averageLoss,
      largestWin: faker.number.float({
        min: 100,
        max: 1000,
        fractionDigits: 2,
      }),
      largestLoss: -faker.number.float({
        min: 50,
        max: 500,
        fractionDigits: 2,
      }),
      maxDrawdown: -faker.number.float({
        min: 100,
        max: 1000,
        fractionDigits: 2,
      }),
      sharpeRatio: faker.number.float({ min: 0.5, max: 3, fractionDigits: 2 }),
      sortinoRatio: faker.number.float({ min: 0.8, max: 4, fractionDigits: 2 }),
      calculatedAt: new Date(),
    },
  });

  return snapshot;
}

/**
 * Helper to create complete portfolio tracking test data
 * Creates connection + trades + performance snapshots for all periods
 */
export async function createCompletePortfolioData(options: {
  traderProfileId: string;
  tradesCount?: number;
  winrate?: number;
}) {
  // 1. Create exchange connection (or reuse existing to avoid unique constraint violation)
  // ✅ FIX: Use findFirst to check if connection already exists, or create new one
  const existingConnection = await prisma.exchangeConnection.findFirst({
    where: {
      traderProfileId: options.traderProfileId,
      exchange: "BINANCE",
    },
  });

  const connection =
    existingConnection ??
    (await createMockExchangeConnection({
      traderProfileId: options.traderProfileId,
      isActive: true,
    }));

  // 2. Create trades
  const trades = await createMockExchangeTrades({
    connectionId: connection.id,
    count: options.tradesCount ?? 50,
  });

  // 3. Create performance snapshots for all periods (in parallel)
  const periods = ["ALL_TIME", "LAST_365D", "LAST_90D", "LAST_30D"] as const;

  const snapshots = await Promise.all(
    periods.map(async (period) =>
      createMockPerformanceSnapshot({
        traderProfileId: options.traderProfileId,
        period,
        winrate: options.winrate,
      }),
    ),
  );

  return {
    connection,
    trades,
    snapshots,
  };
}
