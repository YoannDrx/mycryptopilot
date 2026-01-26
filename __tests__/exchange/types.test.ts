import { describe, expect, it } from "vitest";
import {
  validateConsolidatedBalance,
  validateNormalizedTrade,
  validateOrderResult,
  validatePositionSnapshot,
} from "@/lib/exchange/types";

describe("exchange types schema", () => {
  it("valide un bilan consolidé spot + futures", () => {
    const balance = validateConsolidatedBalance({
      timestamp: new Date("2025-01-01T00:00:00Z"),
      spot: {
        totalUsd: 15000,
        assets: {
          BTC: { asset: "BTC", free: 0.2, locked: 0, total: 0.2, usdValue: 10000 },
          ETH: { asset: "ETH", free: 2, locked: 0, total: 2, usdValue: 5000 },
        },
      },
      futures: {
        totalUsd: 6000,
        assets: {
          USDT: { asset: "USDT", free: 6000, locked: 0, total: 6000 },
        },
        marginUsed: 2000,
        marginAvailable: 4000,
        unrealizedPnl: 250,
        raw: { note: "sample" },
      },
      totalEquityUsd: 21000,
    });

    expect(balance.totalEquityUsd).toBe(21000);
    expect(balance.spot.assets.BTC.usdValue).toBe(10000);
  });

  it("valide un trade normalisé", () => {
    const trade = validateNormalizedTrade({
      id: "trade-1",
      orderId: "order-1",
      symbol: "BTCUSDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 0.01,
      price: 50000,
      quoteQuantity: 500,
      fee: 0.1,
      feeCurrency: "USDT",
      executedAt: new Date("2025-01-02T00:00:00Z"),
      instrumentType: "SPOT",
      realizedPnl: null,
      positionSide: null,
    });

    expect(trade.symbol).toBe("BTCUSDT");
    expect(trade.quoteQuantity).toBe(500);
  });

  it("valide un snapshot de position futures", () => {
    const position = validatePositionSnapshot({
      symbol: "BTCUSDT",
      side: "LONG",
      quantity: 0.1,
      entryPrice: 48000,
      markPrice: 50000,
      leverage: 5,
      margin: 960,
      unrealizedPnl: 200,
      liquidationPrice: 42000,
      type: "FUTURES_USDT",
      openedAt: new Date("2025-01-01T10:00:00Z"),
      lastUpdatedAt: new Date("2025-01-01T12:00:00Z"),
    });

    expect(position.unrealizedPnl).toBe(200);
    expect(position.type).toBe("FUTURES_USDT");
  });

  it("valide un résultat d'ordre avec fill", () => {
    const order = validateOrderResult({
      orderId: "123",
      clientOrderId: "client-123",
      symbol: "ETHUSDT",
      status: "FILLED",
      executedQty: 2,
      executedPrice: 2500,
      cummulativeQuoteQty: 5000,
      fills: [
        { price: 2500, quantity: 1, fee: 0.01, feeCurrency: "USDT" },
        { price: 2500, quantity: 1, fee: 0.01, feeCurrency: "USDT" },
      ],
      transactTime: new Date("2025-01-03T15:00:00Z"),
    });

    expect(order.status).toBe("FILLED");
    expect(order.fills).toHaveLength(2);
  });
});
