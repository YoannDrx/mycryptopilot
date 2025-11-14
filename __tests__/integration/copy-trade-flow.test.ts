import { describe, it, expect, beforeEach, vi } from "vitest";
import { processCopyTradeJobForTest } from "@/lib/queue/copy-trade-worker";
import type { CopyTradeJobData } from "@/lib/queue/copy-trade-jobs";

const executeCopyTradeMock = vi.hoisted(() => vi.fn());
const failCopyTradeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trading/copy-trade.service", () => ({
  executeCopyTrade: executeCopyTradeMock,
  failCopyTrade: failCopyTradeMock,
}));

vi.mock("@/lib/queue/circuit-breaker.service", () => ({
  checkCircuitBreaker: vi.fn(),
  incrementTradeCounter: vi.fn(),
  recordLoss: vi.fn(),
  CircuitBreakerTrippedError: class CircuitBreakerTrippedError extends Error {},
}));

const decryptApiKeyMock = vi.hoisted(() => vi.fn(() => "decrypted-key"));
vi.mock("@/lib/crypto/encryption-service", () => ({
  decryptApiKey: decryptApiKeyMock,
}));

const createExchangeServiceMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/exchange/exchange-service-factory", () => ({
  createExchangeService: createExchangeServiceMock,
}));

const prismaMock = vi.hoisted(() => ({
  userExchangeConnection: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const baseJob: CopyTradeJobData = {
  userId: "user-1",
  copyTradeId: "copy-1",
  originalTradeId: "trade-1",
  traderProfileId: "profile-1",
  symbol: "BTCUSDT",
  side: "BUY",
  orderType: "MARKET",
  quantity: 1,
  limitPrice: 100,
  copyRatio: 1,
  exchangeId: "exchange-1",
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  createExchangeServiceMock.mockReset();
  executeCopyTradeMock.mockReset();
  failCopyTradeMock.mockReset();
  decryptApiKeyMock.mockReset();

  prismaMock.userExchangeConnection.findUnique.mockResolvedValue({
    id: "exchange-1",
    exchange: "BINANCE",
    encryptedApiKey: "enc",
    encryptedSecretKey: "enc",
    keyIv: "iv",
    keyTag: "tag",
    isActive: true,
  });

  createExchangeServiceMock.mockReturnValue({
    createOrder: vi.fn().mockResolvedValue({
      orderId: "order-1",
      executedPrice: 100,
      executedQty: 1,
      cummulativeQuoteQty: 100,
      fills: [],
      transactTime: new Date(),
      status: "FILLED",
      raw: {},
    }),
    close: vi.fn(),
  });
});

describe("Copy trade worker integration", () => {
  it("executes copy trade when parameters are valid", async () => {
    await processCopyTradeJobForTest({
      ...baseJob,
      instrumentType: "SPOT",
    });

    expect(executeCopyTradeMock).toHaveBeenCalledWith(
      expect.objectContaining({ copyTradeId: "copy-1" }),
    );
    expect(failCopyTradeMock).not.toHaveBeenCalled();
  });

  it("fails when slippage exceeds threshold", async () => {
    createExchangeServiceMock.mockReturnValue({
      createOrder: vi.fn().mockResolvedValue({
        orderId: "order-2",
        executedPrice: 105, // 5% slippage
        executedQty: 1,
        cummulativeQuoteQty: 105,
        fills: [],
        transactTime: new Date(),
        status: "FILLED",
        raw: {},
      }),
      close: vi.fn(),
    });

    await expect(
      processCopyTradeJobForTest({
        ...baseJob,
        instrumentType: "SPOT",
      }),
    ).rejects.toThrow("SLIPPAGE_EXCEEDED");

    expect(failCopyTradeMock).toHaveBeenCalledWith(
      "copy-1",
      expect.stringContaining("SLIPPAGE_EXCEEDED"),
      "SLIPPAGE_EXCEEDED",
      expect.any(String),
    );
  });
});
