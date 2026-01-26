import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Exchange } from "@/generated/prisma";
import { syncConnectionTrades } from "@/lib/exchange/sync-service";

const prismaMocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  findMany: vi.fn(),
  updateConnection: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    exchangeTrade: {
      upsert: prismaMocks.upsert,
      findMany: prismaMocks.findMany,
    },
    exchangeConnection: {
      update: prismaMocks.updateConnection,
    },
  },
}));

const loggerSpy = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: loggerSpy,
}));

const decryptMock = vi.hoisted(() => vi.fn().mockReturnValue("decrypted-key"));
const decryptSerializedPayloadMock = vi.hoisted(() =>
  vi.fn().mockReturnValue("decrypted-secret"),
);
const decryptOptionalSerializedPayloadMock = vi.hoisted(() =>
  vi.fn().mockReturnValue(null),
);
vi.mock("@/lib/crypto/encryption-service", () => ({
  decryptApiKey: decryptMock,
  decryptSerializedPayload: decryptSerializedPayloadMock,
  decryptOptionalSerializedPayload: decryptOptionalSerializedPayloadMock,
}));

const exchangeServiceMocks = vi.hoisted(() => ({
  fetchRecentTrades: vi.fn(),
  close: vi.fn(),
}));

const mockExchangeService = exchangeServiceMocks;

const exchangeFactory = vi.hoisted(() => ({
  createExchangeService: vi.fn(),
}));

const createExchangeServiceMock = exchangeFactory.createExchangeService;
createExchangeServiceMock.mockReturnValue(mockExchangeService as never);

vi.mock("@/lib/exchange/exchange-service-factory", () => ({
  createExchangeService: exchangeFactory.createExchangeService,
}));

const planLimitMocks = vi.hoisted(() => ({
  calculateNextSyncAt: vi.fn().mockReturnValue(new Date("2025-12-11T00:00:00Z")),
}));

vi.mock("@/features/exchange/exchange-plan-limits", () => ({
  calculateNextSyncAt: planLimitMocks.calculateNextSyncAt,
}));

const sendSyncFailureNotificationMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/exchange/email-notifications", () => ({
  sendSyncFailureNotification: sendSyncFailureNotificationMock,
}));

const aggregateTraderFillsMock = vi.fn().mockResolvedValue({
  fillsProcessed: 2,
  sessionsCreated: 1,
});
vi.mock("@/lib/trading/fill-aggregation.service", () => ({
  aggregateTraderFills: aggregateTraderFillsMock,
}));

const updatePerformanceSnapshotsMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/exchange/performance-calculator", () => ({
  updatePerformanceSnapshots: updatePerformanceSnapshotsMock,
}));

type MockConnection = {
  id: string;
  exchange: Exchange;
  traderProfileId: string;
  trader: { user: { planName: "free" | "pro" | "ultra" } };
  encryptedApiKey: string;
  encryptedSecretKey: string;
  keyIv: string;
  keyTag: string;
  lastSyncedAt: Date | null;
};

const buildConnection = (
  overrides: Partial<MockConnection> = {},
): MockConnection => ({
  id: "conn_1",
  exchange: "BINANCE",
  traderProfileId: "tp_1",
  trader: { user: { planName: "pro" } },
  encryptedApiKey: "enc-key",
  encryptedSecretKey: "enc-secret",
  keyIv: "iv",
  keyTag: "tag",
  lastSyncedAt: null,
  ...overrides,
});

describe("syncConnectionTrades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeService.fetchRecentTrades.mockReset();
    mockExchangeService.close.mockReset();
    createExchangeServiceMock.mockReturnValue(mockExchangeService as never);
    prismaMocks.upsert.mockReset();
    prismaMocks.findMany.mockReset();
    prismaMocks.updateConnection.mockReset();
    planLimitMocks.calculateNextSyncAt.mockReturnValue(
      new Date("2025-12-11T00:00:00Z"),
    );
    decryptSerializedPayloadMock.mockReset();
    decryptOptionalSerializedPayloadMock.mockReset();
    sendSyncFailureNotificationMock.mockReset();
  });

  it("syncs trades, aggregates fills and updates snapshots", async () => {
    const connection = buildConnection();
    const trades = [
      {
        externalOrderId: "order-1",
        symbol: "BTCUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 1,
        price: 50000,
        quoteQuantity: 50000,
        fee: 10,
        feeAsset: "USDT",
        realizedPnl: 0,
        executedAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        externalOrderId: "order-2",
        symbol: "ETHUSDT",
        side: "SELL",
        type: "LIMIT",
        quantity: 2,
        price: 3000,
        quoteQuantity: 6000,
        fee: 5,
        feeAsset: "USDT",
        realizedPnl: 100,
        executedAt: new Date("2025-01-01T00:10:00Z"),
      },
    ];

    mockExchangeService.fetchRecentTrades.mockResolvedValue(trades);
    prismaMocks.upsert.mockResolvedValue({ success: true });
    prismaMocks.findMany
      .mockResolvedValueOnce([{ symbol: "BTCUSDT" }, { symbol: "ETHUSDT" }])
      .mockResolvedValueOnce(trades);

    const result = await syncConnectionTrades(
      connection as unknown as Parameters<typeof syncConnectionTrades>[0],
    );

    expect(result).toEqual({
      success: true,
      tradesFetched: trades.length,
      tradesImported: trades.length,
    });
    expect(planLimitMocks.calculateNextSyncAt).toHaveBeenCalledWith("pro");
    expect(prismaMocks.updateConnection).toHaveBeenCalledWith({
      where: { id: connection.id },
      data: expect.objectContaining({
        lastSyncedAt: expect.any(Date),
        nextSyncAt: expect.any(Date),
        lastSyncError: null,
      }),
    });
    expect(aggregateTraderFillsMock).toHaveBeenCalledWith(
      connection.traderProfileId,
    );
    expect(updatePerformanceSnapshotsMock).toHaveBeenCalledWith(
      connection.traderProfileId,
      trades,
    );
    expect(mockExchangeService.close).toHaveBeenCalled();
  });

  it("handles fetch errors, updates error fields and notifies trader", async () => {
    const connection = buildConnection({
      lastSyncedAt: new Date("2025-01-01T00:00:00Z"),
    });

    mockExchangeService.fetchRecentTrades.mockRejectedValue(
      new Error("RPC down"),
    );
    prismaMocks.findMany.mockResolvedValue([]);

    const result = await syncConnectionTrades(
      connection as unknown as Parameters<typeof syncConnectionTrades>[0],
    );

    expect(result).toEqual({
      success: false,
      tradesFetched: 0,
      tradesImported: 0,
      error: "RPC down",
    });
    expect(prismaMocks.updateConnection).toHaveBeenCalledWith({
      where: { id: connection.id },
      data: expect.objectContaining({
        lastSyncError: "RPC down",
      }),
    });
    expect(sendSyncFailureNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: connection.id,
        errorMessage: "RPC down",
      }),
    );
    expect(mockExchangeService.close).toHaveBeenCalled();
  });
});
