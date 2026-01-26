import { describe, it, expect, beforeEach, vi } from "vitest";
import { BitgetNativeService } from "@/lib/exchange/bitget-native-service";

const mockV3 = vi.hoisted(() => ({
  getBalances: vi.fn(),
  getAccountSettings: vi.fn(),
  getCurrentPosition: vi.fn(),
  getTradeFills: vi.fn(),
  submitNewOrder: vi.fn(),
  getOrderInfo: vi.fn(),
  cancelOrder: vi.fn(),
}));

const mockV2 = vi.hoisted(() => ({
  getFundingAssets: vi.fn(),
  getFuturesAccountAssets: vi.fn(),
  getFuturesPositions: vi.fn(),
  getSpotHistoricOrders: vi.fn(),
  getFuturesHistoricOrders: vi.fn(),
}));

vi.mock("bitget-api", () => ({
  RestClientV3: vi.fn().mockImplementation(() => mockV3),
  RestClientV2: vi.fn().mockImplementation(() => mockV2),
}));

const createService = (options?: { accountMode?: "UTA" | "CLASSIC" }) =>
  new BitgetNativeService("api", "secret", "passphrase", options);

describe("BitgetNativeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockV3.getBalances.mockResolvedValue({
      data: {
        accountEquity: "1000",
        usdtEquity: "800",
        unrealisedPnl: "50",
        imr: "100",
        assets: [
          {
            coin: "USDT",
            balance: "500",
            available: "400",
            locked: "100",
            usdValue: "500",
          },
        ],
      },
    });
    mockV3.getAccountSettings.mockResolvedValue({
      data: { symbolConfigList: [] },
    });
  });

  it("throws if passphrase is missing", () => {
    expect(() => new BitgetNativeService("api", "secret", undefined)).toThrow(
      "Bitget API passphrase is required",
    );
  });

  it("fetches balance in UTA mode", async () => {
    const service = createService();
    const balance = await service.fetchConsolidatedBalance();

    expect(balance.totalEquityUsd).toBeCloseTo(1000);
    expect(balance.spot.assets.USDT.total).toBeCloseTo(500);
  });

  it("falls back to classic mode when V3 returns classic error", async () => {
    mockV3.getBalances.mockRejectedValueOnce({
      body: { code: "40084" },
    });
    mockV2.getFundingAssets.mockResolvedValue({
      data: [{ coin: "USDT", available: "20", frozen: "0", usdtValue: "20" }],
    });
    mockV2.getFuturesAccountAssets.mockResolvedValue({ data: [] });

    const service = createService();
    const balance = await service.fetchConsolidatedBalance();

    expect(balance.totalEquityUsd).toBeCloseTo(20);
    expect(mockV2.getFundingAssets).toHaveBeenCalled();
  });

  it("returns connection status with account mode", async () => {
    const service = createService();
    const status = await service.testConnection();

    expect(status.isValid).toBe(true);
    expect(status.bitgetAccountMode).toBe("UTA");
  });

  it("creates an order and maps order info", async () => {
    mockV3.submitNewOrder.mockResolvedValue({ data: { orderId: "order-1" } });
    mockV3.getOrderInfo.mockResolvedValue({
      data: {
        orderId: "order-1",
        clientOid: "client-1",
        symbol: "BTCUSDT",
        orderStatus: "filled",
        cumExecQty: "1",
        avgPrice: "25000",
        cumExecValue: "25000",
        updatedTime: String(Date.now()),
      },
    });

    const service = createService();
    const result = await service.createOrder({
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      quantity: 1,
      instrumentType: "SPOT",
    });

    expect(result.orderId).toBe("order-1");
    expect(result.status).toBe("FILLED");
    expect(result.executedQty).toBe(1);
  });
});
