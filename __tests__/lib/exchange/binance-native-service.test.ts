/**
 * Tests for BinanceNativeService
 *
 * Coverage:
 * - fetchConsolidatedBalance (spot + futures)
 * - fetchOpenPositions
 * - fetchTradesPaginated
 * - createOrder (spot + futures)
 * - cancelOrder
 * - getOrderStatus
 * - testConnection
 * - fetchRecentTrades (spot + futures)
 *
 * Strategy: Mock Binance SDK (MainClient + USDMClient)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BinanceNativeService } from "@/lib/exchange/binance-native-service";
import type { CreateOrderParams } from "@/lib/exchange/types";

// Mock Binance SDK
vi.mock("binance", () => ({
  MainClient: vi.fn(),
  USDMClient: vi.fn(),
}));

describe("BinanceNativeService", () => {
  let service: BinanceNativeService;
  let mockMainClient: {
    getAccountInformation: ReturnType<typeof vi.fn>;
    testConnectivity: ReturnType<typeof vi.fn>;
    submitNewOrder: ReturnType<typeof vi.fn>;
    cancelOrder: ReturnType<typeof vi.fn>;
    getOrder: ReturnType<typeof vi.fn>;
    getAccountTradeList: ReturnType<typeof vi.fn>;
    getExchangeInfo: ReturnType<typeof vi.fn>;
    get24hrChangeStatistics: ReturnType<typeof vi.fn>;
    getApiKeyPermissions: ReturnType<typeof vi.fn>;
  };
  let mockUSDMClient: {
    getBalance: ReturnType<typeof vi.fn>;
    getPositions: ReturnType<typeof vi.fn>;
    getPositionsV3: ReturnType<typeof vi.fn>;
    submitNewOrder: ReturnType<typeof vi.fn>;
    cancelOrder: ReturnType<typeof vi.fn>;
    getOrder: ReturnType<typeof vi.fn>;
    getAccountTrades: ReturnType<typeof vi.fn>;
    getExchangeInfo: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock clients
    mockMainClient = {
      getAccountInformation: vi.fn(),
      testConnectivity: vi.fn(),
      submitNewOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getOrder: vi.fn(),
      getAccountTradeList: vi.fn(),
      getExchangeInfo: vi.fn(),
      get24hrChangeStatistics: vi.fn(),
      getApiKeyPermissions: vi.fn(),
    };

    mockUSDMClient = {
      getBalance: vi.fn(),
      getPositions: vi.fn(),
      getPositionsV3: vi.fn(),
      submitNewOrder: vi.fn(),
      cancelOrder: vi.fn(),
      getOrder: vi.fn(),
      getAccountTrades: vi.fn(),
      getExchangeInfo: vi.fn(),
    };

    // Mock constructors to return our mocks
    const { MainClient, USDMClient } = await import("binance");
    (MainClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mockMainClient,
    );
    (USDMClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mockUSDMClient,
    );

    // Create service instance
    service = new BinanceNativeService("test-api-key", "test-secret-key");

    mockMainClient.getAccountInformation.mockResolvedValue({ balances: [] });
    mockMainClient.getApiKeyPermissions.mockResolvedValue({
      enableSpotAndMarginTrading: false,
      enableFutures: false,
    });
    mockUSDMClient.getPositionsV3.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchConsolidatedBalance", () => {
    it("should fetch and combine spot + futures balances", async () => {
      // Mock spot balance response
      mockMainClient.getAccountInformation.mockResolvedValue({
        balances: [
          { asset: "USDT", free: "1000.00", locked: "0.00" },
          { asset: "BTC", free: "0.5", locked: "0.1" },
        ],
        canTrade: true,
        canWithdraw: true,
        canDeposit: true,
      });

      // Mock futures balance response
      mockUSDMClient.getBalance.mockResolvedValue([
        {
          asset: "USDT",
          availableBalance: "2000.00",
          balance: "2000.00",
          crossUnPnl: "50.00",
          crossWalletBalance: "2000.00",
        },
      ]);

      const balance = await service.fetchConsolidatedBalance();

      // Verify spot balance
      expect(balance.spot).toBeDefined();
      expect(balance.spot.assets.USDT).toBeDefined();
      expect(balance.spot.assets.USDT.total).toBe(1000);
      expect(balance.spot.assets.BTC).toBeDefined();
      expect(balance.spot.assets.BTC.total).toBe(0.6); // 0.5 free + 0.1 locked

      // Verify futures balance
      expect(balance.futures).toBeDefined();
      expect(balance.futures?.totalUsd).toBe(2000);

      // Verify total equity
      expect(balance.totalEquityUsd).toBeGreaterThan(0);

      // Verify API calls
      expect(mockMainClient.getAccountInformation).toHaveBeenCalledTimes(1);
      expect(mockUSDMClient.getBalance).toHaveBeenCalledTimes(1);
    });

    it("should handle spot-only account (no futures)", async () => {
      mockMainClient.getAccountInformation.mockResolvedValue({
        balances: [{ asset: "USDT", free: "1000.00", locked: "0.00" }],
        canTrade: true,
      });

      mockUSDMClient.getBalance.mockRejectedValue(
        new Error("Futures not enabled"),
      );

      const balance = await service.fetchConsolidatedBalance();

      expect(balance.spot).toBeDefined();
      expect(balance.futures).toBeUndefined(); // Returns undefined, not null
      expect(balance.totalEquityUsd).toBeGreaterThan(0);
    });

    it("should handle empty balances", async () => {
      mockMainClient.getAccountInformation.mockResolvedValue({
        balances: [],
        canTrade: true,
      });

      mockUSDMClient.getBalance.mockResolvedValue([]);

      const balance = await service.fetchConsolidatedBalance();

      expect(balance.spot.totalUsd).toBe(0);
      expect(balance.totalEquityUsd).toBe(0);
    });
  });

  describe("fetchOpenPositions", () => {
    it("should fetch and normalize futures positions", async () => {
      mockUSDMClient.getPositions.mockResolvedValue([
        {
          symbol: "BTCUSDT",
          positionAmt: "0.5",
          entryPrice: "50000.00",
          markPrice: "51000.00",
          unRealizedProfit: "500.00",
          liquidationPrice: "45000.00",
          leverage: "10",
          positionSide: "BOTH",
        },
        {
          symbol: "ETHUSDT",
          positionAmt: "-2.0",
          entryPrice: "3000.00",
          markPrice: "2950.00",
          unRealizedProfit: "100.00",
          liquidationPrice: "3200.00",
          leverage: "5",
          positionSide: "BOTH",
        },
      ]);

      const positions = await service.fetchOpenPositions();

      expect(positions).toHaveLength(2);

      // Verify BTC position
      expect(positions[0].symbol).toBe("BTCUSDT");
      expect(positions[0].quantity).toBe(0.5);
      expect(positions[0].side).toBe("LONG");
      expect(positions[0].entryPrice).toBe(50000);
      expect(positions[0].markPrice).toBe(51000);
      expect(positions[0].unrealizedPnl).toBe(500);
      expect(positions[0].leverage).toBe(10);

      // Verify ETH position (short)
      expect(positions[1].symbol).toBe("ETHUSDT");
      expect(positions[1].quantity).toBe(2.0);
      expect(positions[1].side).toBe("SHORT");
      expect(positions[1].unrealizedPnl).toBe(100);

      expect(mockUSDMClient.getPositions).toHaveBeenCalledTimes(1);
    });

    it("should filter out zero positions", async () => {
      mockUSDMClient.getPositions.mockResolvedValue([
        {
          symbol: "BTCUSDT",
          positionAmt: "0.5",
          entryPrice: "50000.00",
          markPrice: "51000.00",
          unRealizedProfit: "500.00",
          liquidationPrice: "45000.00",
          leverage: "10",
          positionSide: "BOTH",
        },
        {
          symbol: "ETHUSDT",
          positionAmt: "0.0", // Zero position
          entryPrice: "0.00",
          markPrice: "0.00",
          unRealizedProfit: "0.00",
          liquidationPrice: "0.00",
          leverage: "1",
          positionSide: "BOTH",
        },
      ]);

      const positions = await service.fetchOpenPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe("BTCUSDT");
    });

    it("should return empty array when no positions", async () => {
      mockUSDMClient.getPositions.mockResolvedValue([]);

      const positions = await service.fetchOpenPositions();

      expect(positions).toEqual([]);
    });
  });

  describe("createOrder", () => {
    const spotOrderParams: CreateOrderParams = {
      symbol: "BTCUSDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 0.001,
      price: 50000,
      instrumentType: "SPOT",
    };

    const futuresOrderParams: CreateOrderParams = {
      symbol: "BTCUSDT",
      side: "SELL",
      type: "MARKET",
      quantity: 0.01,
      instrumentType: "FUTURES_USDT",
    };

    it("should create spot limit order", async () => {
      mockMainClient.submitNewOrder.mockResolvedValue({
        orderId: 123456,
        symbol: "BTCUSDT",
        status: "NEW",
        side: "BUY",
        type: "LIMIT",
        price: "50000.00",
        origQty: "0.001",
        executedQty: "0.000",
        transactTime: Date.now(),
      });

      const result = await service.createOrder(spotOrderParams);

      expect(result.orderId).toBe("123456");
      expect(result.symbol).toBe("BTCUSDT");
      expect(result.status).toBe("NEW");

      expect(mockMainClient.submitNewOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: "BTCUSDT",
          side: "BUY",
          type: "LIMIT",
          quantity: 0.001, // Numbers, not strings
          price: 50000,
          // Note: timeInForce is optional and may not be included
        }),
      );
    });

    it("should create futures market order", async () => {
      mockUSDMClient.submitNewOrder.mockResolvedValue({
        orderId: 789012,
        symbol: "BTCUSDT",
        status: "FILLED",
        side: "SELL",
        type: "MARKET",
        price: "0", // Market orders don't have a price
        origQty: "0.01",
        executedQty: "0.01",
        updateTime: Date.now(),
        fills: [
          // executedPrice is calculated from fills
          {
            price: "51000.00",
            qty: "0.01",
            commission: "0.051",
            commissionAsset: "USDT",
          },
        ],
      });

      const result = await service.createOrder(futuresOrderParams);

      expect(result.orderId).toBe("789012");
      expect(result.symbol).toBe("BTCUSDT");
      expect(result.status).toBe("FILLED");
      expect(result.executedPrice).toBe(51000); // From fills

      expect(mockUSDMClient.submitNewOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: "BTCUSDT",
          side: "SELL",
          type: "MARKET",
          quantity: 0.01, // Number, not string
        }),
      );
    });

    it("should handle order rejection", async () => {
      mockMainClient.submitNewOrder.mockRejectedValue(
        new Error("Insufficient balance"),
      );

      await expect(service.createOrder(spotOrderParams)).rejects.toThrow(
        "Insufficient balance",
      );
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order successfully", async () => {
      mockMainClient.cancelOrder.mockResolvedValue({
        orderId: 123456,
        symbol: "BTCUSDT",
        status: "CANCELED",
      });

      await expect(
        service.cancelOrder({
          symbol: "BTCUSDT",
          orderId: "123456",
        }),
      ).resolves.not.toThrow();

      expect(mockMainClient.cancelOrder).toHaveBeenCalledWith({
        symbol: "BTCUSDT",
        orderId: 123456,
      });
    });

    it("should handle cancel failure", async () => {
      mockMainClient.cancelOrder.mockRejectedValue(
        new Error("Order not found"),
      );

      await expect(
        service.cancelOrder({
          symbol: "BTCUSDT",
          orderId: "999999",
        }),
      ).rejects.toThrow("Order not found");
    });

    it("should cancel order by clientOrderId", async () => {
      mockMainClient.cancelOrder.mockResolvedValue({
        orderId: 123456,
        symbol: "BTCUSDT",
        status: "CANCELED",
      });

      await service.cancelOrder({
        symbol: "BTCUSDT",
        clientOrderId: "my-client-id",
      });

      expect(mockMainClient.cancelOrder).toHaveBeenCalledWith({
        symbol: "BTCUSDT",
        origClientOrderId: "my-client-id",
      });
    });
  });

  describe("getOrderStatus", () => {
    it("should fetch order status", async () => {
      const now = Date.now();
      mockMainClient.getOrder.mockResolvedValue({
        orderId: 123456,
        symbol: "BTCUSDT",
        status: "FILLED",
        side: "BUY",
        type: "LIMIT",
        price: "50000.00",
        origQty: "0.001",
        executedQty: "0.001",
        time: now,
      });

      const status = await service.getOrderStatus({
        symbol: "BTCUSDT",
        orderId: "123456",
      });

      expect(status.orderId).toBe("123456");
      expect(status.status).toBe("FILLED");
      expect(status.executedQty).toBe(0.001);
      expect(status.price).toBe(50000);
    });

    it("should fetch partially filled order status", async () => {
      const now = Date.now();
      mockMainClient.getOrder.mockResolvedValue({
        orderId: 789012,
        symbol: "BTCUSDT",
        status: "PARTIALLY_FILLED",
        side: "SELL",
        type: "LIMIT",
        price: "51000.00",
        origQty: "0.01",
        executedQty: "0.005",
        updateTime: now,
      });

      const status = await service.getOrderStatus({
        symbol: "BTCUSDT",
        orderId: "789012",
      });

      expect(status.status).toBe("PARTIALLY_FILLED");
      expect(status.executedQty).toBe(0.005);
      expect(status.price).toBe(51000);
    });

    it("should handle order with stop price", async () => {
      const now = Date.now();
      mockMainClient.getOrder.mockResolvedValue({
        orderId: 111111,
        symbol: "BTCUSDT",
        status: "NEW",
        side: "BUY",
        type: "STOP_LOSS_LIMIT",
        price: "49000.00",
        stopPrice: "49500.00",
        origQty: "0.001",
        executedQty: "0.000",
        time: now,
      });

      const status = await service.getOrderStatus({
        symbol: "BTCUSDT",
        orderId: "111111",
      });

      expect(status.stopPrice).toBe(49500);
    });
  });

  describe("testConnection", () => {
    it("should validate API keys and permissions", async () => {
      mockMainClient.getApiKeyPermissions.mockResolvedValue({
        enableSpotAndMarginTrading: false,
        enableFutures: false,
      });

      const result = await service.testConnection();

      expect(result.isValid).toBe(true);
      expect(result.isReadOnly).toBe(true); // isReadOnly = !canTrade
      expect(result.canTrade).toBe(false);
      expect(mockMainClient.getApiKeyPermissions).toHaveBeenCalled();
    });

    it("should detect non-read-only keys", async () => {
      mockMainClient.getApiKeyPermissions.mockResolvedValue({
        enableSpotAndMarginTrading: true,
        enableFutures: false,
      });

      const result = await service.testConnection();

      expect(result.isValid).toBe(true);
      expect(result.isReadOnly).toBe(false);
    });

    it("should handle invalid API keys", async () => {
      mockMainClient.getApiKeyPermissions.mockRejectedValue(
        new Error("Invalid API key"),
      );

      const result = await service.testConnection();

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("Invalid API key");
    });
  });

  describe("fetchRecentTrades", () => {
    it("should fetch spot and futures trades", async () => {
      mockMainClient.getAccountInformation.mockResolvedValue({
        balances: [
          { asset: "BTC", free: "0.2", locked: "0" },
          { asset: "ETH", free: "1", locked: "0" },
        ],
      });
      mockMainClient.getExchangeInfo.mockResolvedValue({
        symbols: [
          {
            symbol: "BTCUSDT",
            status: "TRADING",
            baseAsset: "BTC",
            quoteAsset: "USDT",
          },
          {
            symbol: "ETHUSDT",
            status: "TRADING",
            baseAsset: "ETH",
            quoteAsset: "USDT",
          },
        ],
      });
      mockUSDMClient.getPositionsV3.mockResolvedValue([
        { symbol: "BTCUSDT", positionAmt: "0.01" },
      ]);

      // Mock spot trades
      mockMainClient.getAccountTradeList.mockResolvedValue([
        {
          orderId: 123,
          symbol: "BTCUSDT",
          isBuyer: true,
          qty: "0.001",
          price: "50000.00",
          quoteQty: "50.00",
          commission: "0.05",
          commissionAsset: "USDT",
          time: Date.now(),
        },
      ]);

      // Mock futures trades
      mockUSDMClient.getAccountTrades.mockResolvedValue([
        {
          orderId: 456,
          symbol: "BTCUSDT",
          buyer: false,
          qty: "0.01",
          price: "51000.00",
          quoteQty: "510.00",
          commission: "0.51",
          commissionAsset: "USDT",
          realizedPnl: "100.00",
          time: Date.now(),
        },
      ]);

      const trades = await service.fetchRecentTrades(30);

      expect(trades.length).toBeGreaterThan(0);

      // Verify spot trade
      const spotTrade = trades.find((t) => t.externalOrderId === "123");
      expect(spotTrade).toBeDefined();
      expect(spotTrade?.side).toBe("BUY");
      expect(spotTrade?.realizedPnl).toBeNull(); // Spot = no PnL

      // Verify futures trade
      const futuresTrade = trades.find((t) => t.externalOrderId === "456");
      expect(futuresTrade).toBeDefined();
      expect(futuresTrade?.side).toBe("SELL");
      expect(futuresTrade?.realizedPnl).toBe(100);
    });

    it("should handle errors gracefully", async () => {
      mockMainClient.getAccountInformation.mockRejectedValue(
        new Error("API down"),
      );
      mockUSDMClient.getPositionsV3.mockRejectedValue(new Error("API down"));

      // The implementation returns empty array instead of throwing
      // (see fetchSpotTradesNative line 664 and fetchFuturesTradesNative line 739)
      const trades = await service.fetchRecentTrades(30);

      expect(trades).toEqual([]);
    });
  });

  describe("close", () => {
    it("should close connections gracefully", async () => {
      await expect(service.close()).resolves.not.toThrow();
    });
  });
});
