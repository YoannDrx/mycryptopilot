import { describe, it, expect, beforeEach, vi } from "vitest";

const restClientMock = {
  getWalletBalance: vi.fn(),
  getPositionInfo: vi.fn(),
  getHistoricOrders: vi.fn(),
  getExecutionList: vi.fn(),
  submitOrder: vi.fn(),
  cancelOrder: vi.fn(),
  getOrderHistory: vi.fn(),
};

vi.mock("bybit-api", () => {
  class RestClientV5 {
    getWalletBalance(...args: unknown[]) {
      return restClientMock.getWalletBalance(...args);
    }

    getPositionInfo(...args: unknown[]) {
      return restClientMock.getPositionInfo(...args);
    }

    getHistoricOrders(...args: unknown[]) {
      return restClientMock.getHistoricOrders(...args);
    }

    getExecutionList(...args: unknown[]) {
      return restClientMock.getExecutionList(...args);
    }

    submitOrder(...args: unknown[]) {
      return restClientMock.submitOrder(...args);
    }

    cancelOrder(...args: unknown[]) {
      return restClientMock.cancelOrder(...args);
    }
  }

  return { RestClientV5 };
});

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { BybitNativeService } from "@/lib/exchange/bybit-native-service";

const resetRestMock = () => {
  Object.values(restClientMock).forEach((fn) => fn.mockReset());
};

describe("BybitNativeService", () => {
  beforeEach(() => {
    resetRestMock();
  });

  it("builds consolidated balance from unified wallet", async () => {
    restClientMock.getWalletBalance.mockResolvedValue({
      result: {
        list: [
          {
            totalEquity: "15000",
            totalMarginBalance: "10000",
            totalAvailableBalance: "8000",
            totalPerpUPL: "200",
            coin: [
              {
                coin: "USDT",
                availableToWithdraw: "7000",
                locked: "0",
                walletBalance: "7000",
                usdValue: "7000",
              },
            ],
          },
        ],
      },
    });

    const service = new BybitNativeService("api", "secret");
    const balance = await service.fetchConsolidatedBalance();

    expect(restClientMock.getWalletBalance).toHaveBeenCalledWith({
      accountType: "UNIFIED",
    });
    expect(balance.spot.totalUsd).toBe(7000);
    expect(balance.futures?.totalUsd).toBe(10000);
    expect(balance.totalEquityUsd).toBe(15000);
  });

  it("maps open positions with getPositionInfo", async () => {
    restClientMock.getPositionInfo.mockResolvedValue({
      result: {
        list: [
          {
            symbol: "BTCUSDT",
            size: "0.01",
            side: "Buy",
            avgPrice: "30000",
            markPrice: "30500",
            leverage: "5",
            positionIM: "100",
            unrealisedPnl: "50",
            liqPrice: "25000",
          },
        ],
      },
    });

    const service = new BybitNativeService("api", "secret");
    const positions = await service.fetchOpenPositions();

    expect(restClientMock.getPositionInfo).toHaveBeenCalledWith({
      category: "linear",
      settleCoin: "USDT",
    });
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({
      symbol: "BTCUSDT",
      side: "LONG",
      leverage: 5,
    });
  });

  it("creates spot order with submitOrder", async () => {
    restClientMock.submitOrder.mockResolvedValue({
      result: {
        orderId: "OID",
        orderLinkId: "CID",
        orderStatus: "Filled",
        avgPrice: "100",
        cumExecQty: "1",
        cumExecValue: "100",
        createdTime: "1700000000000",
        updatedTime: "1700000000000",
      },
    });

    const service = new BybitNativeService("api", "secret");
    const result = await service.createOrder({
      symbol: "ETHUSDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 1,
      price: 100,
      instrumentType: "SPOT",
      clientOrderId: "cid-1",
    });

    expect(restClientMock.submitOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "spot",
        symbol: "ETHUSDT",
        side: "Buy",
        orderType: "Limit",
        orderLinkId: "cid-1",
      }),
    );
    expect(result.orderId).toBe("OID");
  });

  it("fetches spot and linear trades in fetchTradesPaginated", async () => {
    restClientMock.getHistoricOrders.mockResolvedValue({
      result: {
        list: [
          {
            orderId: "123",
            symbol: "ETHUSDT",
            side: "Buy",
            orderType: "Market",
            qty: "0.5",
            price: "2000",
            cumExecValue: "1000",
            cumExecFee: "0.5",
            updatedTime: "1700000000000",
            orderStatus: "Filled",
          },
        ],
      },
    });

    restClientMock.getExecutionList.mockResolvedValue({
      result: {
        list: [
          {
            execId: "linear-1",
            orderId: "lin-order",
            symbol: "ETHUSDT",
            side: "Sell",
            orderType: "Market",
            execQty: "0.1",
            execPrice: "2100",
            execValue: "210",
            execFee: "0.02",
            execTime: "1700000001000",
            closedSize: "5",
            positionIdx: 1,
          },
        ],
      },
    });

    const service = new BybitNativeService("api", "secret");
    const result = await service.fetchTradesPaginated("ETHUSDT", {
      limit: 1,
    });

    expect(restClientMock.getHistoricOrders).toHaveBeenCalledWith({
      category: "spot",
      symbol: "ETHUSDT",
      limit: 1,
    });
    expect(restClientMock.getExecutionList).toHaveBeenCalledWith({
      category: "linear",
      symbol: "ETHUSDT",
      limit: 1,
    });
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0].instrumentType).toBe("FUTURES_USDT");
    expect(result.trades[1].instrumentType).toBe("SPOT");
  });

  it("cancelOrder forwards order id", async () => {
    restClientMock.cancelOrder.mockResolvedValue({});

    const service = new BybitNativeService("api", "secret");
    await service.cancelOrder({
      symbol: "BTCUSDT",
      orderId: "OID-1",
    });

    expect(restClientMock.cancelOrder).toHaveBeenCalledWith({
      category: "spot",
      symbol: "BTCUSDT",
      orderId: "OID-1",
    });
  });
});
