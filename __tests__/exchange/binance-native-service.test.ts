import { describe, it, expect, beforeEach, vi } from "vitest";

// Keep references to mocked client methods so tests can control behaviour
const mainClientMock = {
  getAccountInformation: vi.fn(),
  getAccountTradeList: vi.fn(),
  getApiKeyPermissions: vi.fn(),
  testConnectivity: vi.fn(),
  submitNewOrder: vi.fn(),
  cancelOrder: vi.fn(),
  getOrder: vi.fn(),
  getExchangeInfo: vi.fn(),
  getSymbolPriceTicker: vi.fn(),
  sapiGetMarginAccount: vi.fn(),
  sapiGetAccountApiRestrictions: vi.fn(),
};

const usdmClientMock = {
  getBalance: vi.fn(),
  getPositionInformation: vi.fn(),
  submitNewOrder: vi.fn(),
  getAccountTrades: vi.fn(),
};

vi.mock("binance", () => {
  class MainClient {
    getAccountInformation(...args: unknown[]) {
      return mainClientMock.getAccountInformation(...args);
    }

    getAccountTradeList(...args: unknown[]) {
      return mainClientMock.getAccountTradeList(...args);
    }

    testConnectivity(...args: unknown[]) {
      return mainClientMock.testConnectivity(...args);
    }

    submitNewOrder(...args: unknown[]) {
      return mainClientMock.submitNewOrder(...args);
    }

    cancelOrder(...args: unknown[]) {
      return mainClientMock.cancelOrder(...args);
    }

    getOrder(...args: unknown[]) {
      return mainClientMock.getOrder(...args);
    }

    getExchangeInfo(...args: unknown[]) {
      return mainClientMock.getExchangeInfo(...args);
    }

    getSymbolPriceTicker(...args: unknown[]) {
      return mainClientMock.getSymbolPriceTicker(...args);
    }

    getApiKeyPermissions(...args: unknown[]) {
      return mainClientMock.getApiKeyPermissions(...args);
    }

    sapiGetMarginAccount(...args: unknown[]) {
      return mainClientMock.sapiGetMarginAccount(...args);
    }

    sapiGetAccountApiRestrictions(...args: unknown[]) {
      return mainClientMock.sapiGetAccountApiRestrictions(...args);
    }
  }

  class USDMClient {
    getBalance(...args: unknown[]) {
      return usdmClientMock.getBalance(...args);
    }

    getPositionInformation(...args: unknown[]) {
      return usdmClientMock.getPositionInformation(...args);
    }

    submitNewOrder(...args: unknown[]) {
      return usdmClientMock.submitNewOrder(...args);
    }

    getAccountTrades(...args: unknown[]) {
      return usdmClientMock.getAccountTrades(...args);
    }
  }

  return { MainClient, USDMClient };
});

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { BinanceNativeService } from "@/lib/exchange/binance-native-service";

const resetMocks = () => {
  Object.values(mainClientMock).forEach((fn) => fn.mockReset());
  Object.values(usdmClientMock).forEach((fn) => fn.mockReset());
};

describe("BinanceNativeService", () => {
  beforeEach(() => {
    resetMocks();
    mainClientMock.getApiKeyPermissions.mockResolvedValue({
      enableSpotAndMarginTrading: false,
      enableFutures: false,
    });
  });

  it("combines spot and futures balances in fetchConsolidatedBalance", async () => {
    mainClientMock.getAccountInformation.mockResolvedValue({
      balances: [
        { asset: "USDT", free: "100", locked: "0" },
        { asset: "BTC", free: "0.1", locked: "0" },
      ],
    });
    mainClientMock.getSymbolPriceTicker.mockResolvedValue([
      { symbol: "BTCUSDT", price: "30000" },
    ]);
    mainClientMock.sapiGetMarginAccount.mockResolvedValue({ userAssets: [] });
    usdmClientMock.getBalance.mockResolvedValue([
      {
        asset: "USDT",
        availableBalance: "40",
        balance: "60",
        crossUnPnl: "5",
      },
    ]);

    const service = new BinanceNativeService("api", "secret");
    const balance = await service.fetchConsolidatedBalance();

    expect(mainClientMock.getAccountInformation).toHaveBeenCalled();
    expect(usdmClientMock.getBalance).toHaveBeenCalled();
    expect(balance.spot.totalUsd).toBeCloseTo(100 + 0.1 * 30000, 2);
    expect(balance.futures?.totalUsd).toBe(60);
    expect(balance.futures?.unrealizedPnl).toBe(5);
    await service.close();
  });

  it("falls back gracefully when futures balance is unavailable", async () => {
    mainClientMock.getAccountInformation.mockResolvedValue({
      balances: [{ asset: "USDT", free: "50", locked: "0" }],
    });
    mainClientMock.getSymbolPriceTicker.mockResolvedValue([]);
    usdmClientMock.getBalance.mockRejectedValue(new Error("futures disabled"));
    mainClientMock.sapiGetMarginAccount.mockResolvedValue({ userAssets: [] });

    const service = new BinanceNativeService("api", "secret");
    const balance = await service.fetchConsolidatedBalance();

    expect(balance.spot.totalUsd).toBe(50);
    expect(balance.futures).toBeUndefined();
    await service.close();
  });

  it("includes margin balance when available", async () => {
    mainClientMock.getAccountInformation.mockResolvedValue({
      balances: [{ asset: "USDT", free: "10", locked: "0" }],
    });
    mainClientMock.getSymbolPriceTicker.mockResolvedValue([
      { symbol: "ETHUSDT", price: "2000" },
    ]);
    mainClientMock.sapiGetMarginAccount.mockResolvedValue({
      userAssets: [
        {
          asset: "ETH",
          free: "1",
          borrowed: "0.1",
          interest: "0",
        },
      ],
    });
    usdmClientMock.getBalance.mockResolvedValue(null);

    const service = new BinanceNativeService("api", "secret");
    const balance = await service.fetchConsolidatedBalance();

    expect(balance.margin?.totalUsd).toBeCloseTo(1.1 * 2000, 2);
    expect(balance.totalEquityUsd).toBeCloseTo(
      balance.spot.totalUsd + (balance.margin?.totalUsd ?? 0),
      2,
    );
    await service.close();
  });

  it("maps trades in fetchTradesPaginated", async () => {
    mainClientMock.getAccountTradeList.mockResolvedValue([
      {
        id: 123,
        orderId: 456,
        symbol: "BTCUSDT",
        isBuyer: true,
        qty: "0.01",
        price: "30000",
        quoteQty: "300",
        commission: "0.0001",
        commissionAsset: "BNB",
        time: 1700000000000,
      },
    ]);

    const service = new BinanceNativeService("api", "secret");
    const result = await service.fetchTradesPaginated("BTCUSDT", {
      limit: 2,
      since: 1600000000000,
    });

    expect(mainClientMock.getAccountTradeList).toHaveBeenCalledWith({
      symbol: "BTCUSDT",
      startTime: 1600000000000,
      limit: 2,
    });
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]).toMatchObject({
      id: "123",
      symbol: "BTCUSDT",
      side: "BUY",
      quantity: 0.01,
    });
    expect(result.cursor.hasMore).toBe(false);
    await service.close();
  });

  it("routes createOrder to futures client when instrumentType is FUTURES_USDT", async () => {
    usdmClientMock.submitNewOrder.mockResolvedValue({
      orderId: "9001",
      clientOrderId: "test",
      status: "FILLED",
      side: "BUY",
      type: "MARKET",
      executedQty: "1",
      cummulativeQuoteQty: "100",
      updateTime: 1700000000000,
      price: "100",
      origQty: "1",
    });

    const service = new BinanceNativeService("api", "secret");
    await service.createOrder({
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      quantity: 1,
      instrumentType: "FUTURES_USDT",
    });

    expect(usdmClientMock.submitNewOrder).toHaveBeenCalled();
    expect(mainClientMock.submitNewOrder).not.toHaveBeenCalled();
    await service.close();
  });

  it("cancels order via MainClient with client order id fallback", async () => {
    mainClientMock.cancelOrder.mockResolvedValue({});

    const service = new BinanceNativeService("api", "secret");
    await service.cancelOrder({
      symbol: "ETHUSDT",
      clientOrderId: "cid-123",
    });

    expect(mainClientMock.cancelOrder).toHaveBeenCalledWith({
      symbol: "ETHUSDT",
      origClientOrderId: "cid-123",
    });
    await service.close();
  });

  it("marks keys as read-only when trading permissions are disabled", async () => {
    mainClientMock.getApiKeyPermissions.mockResolvedValue({
      enableSpotAndMarginTrading: false,
      enableFutures: false,
    });

    const service = new BinanceNativeService("api", "secret");
    const status = await service.testConnection();

    expect(mainClientMock.getApiKeyPermissions).toHaveBeenCalled();
    expect(status.isValid).toBe(true);
    expect(status.isReadOnly).toBe(true);
    expect(status.hasSpotEnabled).toBe(false);
    expect(status.hasFuturesEnabled).toBe(false);
    expect(status.canTrade).toBe(false);
    await service.close();
  });

  it("detects trading-enabled keys when spot or futures access is allowed", async () => {
    mainClientMock.getApiKeyPermissions.mockResolvedValue({
      enableSpotAndMarginTrading: true,
      enableFutures: true,
    });

    const service = new BinanceNativeService("api", "secret");
    const status = await service.testConnection();

    expect(status.isValid).toBe(true);
    expect(status.isReadOnly).toBe(false);
    expect(status.hasSpotEnabled).toBe(true);
    expect(status.hasFuturesEnabled).toBe(true);
    expect(status.canTrade).toBe(true);
    await service.close();
  });

  it("testConnection returns failure when API restriction endpoint fails", async () => {
    mainClientMock.getApiKeyPermissions.mockRejectedValue(
      new Error("network down"),
    );

    const service = new BinanceNativeService("api", "secret");
    const status = await service.testConnection();

    expect(status.isValid).toBe(false);
    expect(status.errorMessage).toBe("network down");
    await service.close();
  });
});
