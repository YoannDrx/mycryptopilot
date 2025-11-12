import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Exchange } from "@/generated/prisma";
import {
  syncConnectionTrades,
  syncMultipleConnections,
} from "@/lib/exchange/sync-service";
import * as SyncServiceModule from "@/lib/exchange/sync-service";

const upsertMock = vi.fn();
const exchangeUpdateMock = vi.fn();
const exchangeFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    exchangeTrade: {
      upsert: upsertMock,
      findMany: exchangeFindManyMock,
    },
    exchangeConnection: {
      update: exchangeUpdateMock,
    },
  },
}));

const loggerSpy = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock("@/lib/logger", () => ({
  logger: loggerSpy,
}));

const decryptMock = vi.fn().mockReturnValue("decrypted-key");
vi.mock("@/lib/crypto/encryption-service", () => ({
  decryptApiKey: decryptMock,
}));

const mockExchangeService = {
  fetchRecentTrades: vi.fn(),
  close: vi.fn(),
};

const createExchangeServiceMock = vi
  .fn()
  .mockReturnValue(mockExchangeService);

vi.mock("@/lib/exchange/exchange-service-factory", () => ({
  createExchangeService: createExchangeServiceMock,
}));

const calculateNextSyncAtMock = vi
  .fn()
  .mockReturnValue(new Date("2025-12-11T00:00:00Z"));

vi.mock("@/features/exchange/exchange-plan-limits", () => ({
  calculateNextSyncAt: calculateNextSyncAtMock,
}));

const sendSyncFailureNotificationMock = vi.fn();
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
    upsertMock.mockResolvedValue({ success: true });
    exchangeFindManyMock.mockResolvedValue(trades);

    const result = await syncConnectionTrades(
      connection as unknown as Parameters<typeof syncConnectionTrades>[0],
    );

    expect(result).toEqual({
      success: true,
      tradesFetched: trades.length,
      tradesImported: trades.length,
    });
    expect(calculateNextSyncAtMock).toHaveBeenCalledWith("pro");
    expect(exchangeUpdateMock).toHaveBeenCalledWith({
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

    const result = await syncConnectionTrades(
      connection as unknown as Parameters<typeof syncConnectionTrades>[0],
    );

    expect(result).toEqual({
      success: false,
      tradesFetched: 0,
      tradesImported: 0,
      error: "RPC down",
    });
    expect(exchangeUpdateMock).toHaveBeenCalledWith({
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

describe("syncMultipleConnections", () => {
  it("processes each connection sequentially and aggregates results", async () => {
    const spy = vi
      .spyOn(SyncServiceModule, "syncConnectionTrades")
      .mockResolvedValueOnce({
        success: true,
        tradesFetched: 2,
        tradesImported: 2,
      })
      .mockResolvedValueOnce({
        success: false,
        tradesFetched: 0,
        tradesImported: 0,
        error: "boom",
      });

    const results = await syncMultipleConnections([
      buildConnection(),
      buildConnection({ id: "conn_2" }),
    ] as unknown as Parameters<typeof syncMultipleConnections>[0]);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);

    spy.mockRestore();
  });
});
