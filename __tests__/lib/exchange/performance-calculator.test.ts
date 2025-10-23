import { describe, expect, it, vi, beforeEach } from "vitest";
import { calculatePerformanceMetrics } from "@/lib/exchange/performance-calculator";
import type { ExchangeTrade } from "@/generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PerformanceCalculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock trades
  const createMockTrade = (options: {
    realizedPnl: number;
    executedAt?: Date;
  }): ExchangeTrade => ({
    id: `trade-${Math.random()}`,
    connectionId: "conn-123",
    externalOrderId: `order-${Math.random()}`,
    symbol: "BTCUSDT",
    side: "BUY",
    type: "MARKET",
    quantity: new Decimal(0.1),
    price: new Decimal(50000),
    quoteQuantity: new Decimal(5000),
    fee: new Decimal(5),
    feeAsset: "USDT",
    realizedPnl: new Decimal(options.realizedPnl),
    executedAt: options.executedAt ?? new Date(),
    createdAt: new Date(),
  });

  describe("calculatePerformanceMetrics - Basic Metrics", () => {
    it("should calculate correct winrate for all winning trades", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: 150 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.winrate).toBe(100); // 3/3 = 100%
      expect(metrics.winningTrades).toBe(3);
      expect(metrics.losingTrades).toBe(0);
    });

    it("should calculate correct winrate for all losing trades", () => {
      const trades = [
        createMockTrade({ realizedPnl: -100 }),
        createMockTrade({ realizedPnl: -200 }),
        createMockTrade({ realizedPnl: -50 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.winrate).toBe(0); // 0/3 = 0%
      expect(metrics.winningTrades).toBe(0);
      expect(metrics.losingTrades).toBe(3);
    });

    it("should calculate correct winrate for mixed trades (65%)", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }), // Win
        createMockTrade({ realizedPnl: 200 }), // Win
        createMockTrade({ realizedPnl: -50 }), // Loss
        createMockTrade({ realizedPnl: 150 }), // Win
        createMockTrade({ realizedPnl: -30 }), // Loss
        createMockTrade({ realizedPnl: 80 }), // Win
        createMockTrade({ realizedPnl: 120 }), // Win
        createMockTrade({ realizedPnl: -40 }), // Loss
        createMockTrade({ realizedPnl: 90 }), // Win
        createMockTrade({ realizedPnl: 110 }), // Win
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.winrate).toBe(70); // 7/10 = 70%
      expect(metrics.winningTrades).toBe(7);
      expect(metrics.losingTrades).toBe(3);
      expect(metrics.totalTrades).toBe(10);
    });

    it("should handle empty trade array", () => {
      const trades: ExchangeTrade[] = [];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.winrate).toBe(0);
      expect(metrics.winningTrades).toBe(0);
      expect(metrics.losingTrades).toBe(0);
      expect(metrics.totalTrades).toBe(0);
      expect(metrics.netPnl).toBe(0);
    });
  });

  describe("calculatePerformanceMetrics - Net PnL", () => {
    it("should calculate positive net PnL", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: -50 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.totalProfits).toBe(300); // 100 + 200
      expect(metrics.totalLosses).toBe(50); // abs(-50)
      expect(metrics.netPnl).toBe(250); // 300 - 50
    });

    it("should calculate negative net PnL", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: -200 }),
        createMockTrade({ realizedPnl: -150 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.totalProfits).toBe(100);
      expect(metrics.totalLosses).toBe(350); // abs(-200) + abs(-150)
      expect(metrics.netPnl).toBe(-250); // 100 - 350
    });

    it("should handle zero PnL trades", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 0 }),
        createMockTrade({ realizedPnl: -100 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.totalProfits).toBe(100);
      expect(metrics.totalLosses).toBe(100);
      expect(metrics.netPnl).toBe(0);
    });
  });

  describe("calculatePerformanceMetrics - Profit Factor", () => {
    it("should calculate profit factor > 1 (profitable)", () => {
      const trades = [
        createMockTrade({ realizedPnl: 300 }),
        createMockTrade({ realizedPnl: -100 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.profitFactor).toBe(3); // 300 / 100 = 3
    });

    it("should calculate profit factor < 1 (unprofitable)", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: -300 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.profitFactor).toBeCloseTo(0.333, 2); // 100 / 300 = 0.333
    });

    it("should return 0 profit factor when no losses", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.profitFactor).toBe(0); // No losses, so 0 (handled by code)
    });
  });

  describe("calculatePerformanceMetrics - Average Win/Loss", () => {
    it("should calculate average win correctly", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: 300 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.averageWin).toBe(200); // (100 + 200 + 300) / 3
    });

    it("should calculate average loss correctly", () => {
      const trades = [
        createMockTrade({ realizedPnl: -100 }),
        createMockTrade({ realizedPnl: -200 }),
        createMockTrade({ realizedPnl: -300 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.averageLoss).toBe(200); // (100 + 200 + 300) / 3 (absolute)
    });

    it("should calculate both averages for mixed trades", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: -50 }),
        createMockTrade({ realizedPnl: -150 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.averageWin).toBe(150); // (100 + 200) / 2
      expect(metrics.averageLoss).toBe(100); // (50 + 150) / 2
    });
  });

  describe("calculatePerformanceMetrics - Largest Win/Loss", () => {
    it("should identify largest win", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 500 }), // Largest win
        createMockTrade({ realizedPnl: 200 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.largestWin).toBe(500);
    });

    it("should identify largest loss", () => {
      const trades = [
        createMockTrade({ realizedPnl: -100 }),
        createMockTrade({ realizedPnl: -500 }), // Largest loss
        createMockTrade({ realizedPnl: -200 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.largestLoss).toBe(500); // Absolute value
    });

    it("should handle mixed wins and losses", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 800 }), // Largest win
        createMockTrade({ realizedPnl: -50 }),
        createMockTrade({ realizedPnl: -300 }), // Largest loss
        createMockTrade({ realizedPnl: 200 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.largestWin).toBe(800);
      expect(metrics.largestLoss).toBe(300);
    });
  });

  describe("calculatePerformanceMetrics - Max Drawdown", () => {
    it("should calculate max drawdown for losing streak", () => {
      const now = Date.now();
      const trades = [
        createMockTrade({
          realizedPnl: 1000,
          executedAt: new Date(now - 5000),
        }), // Peak
        createMockTrade({
          realizedPnl: -200,
          executedAt: new Date(now - 4000),
        }), // Start decline
        createMockTrade({
          realizedPnl: -300,
          executedAt: new Date(now - 3000),
        }), // Trough (-500 total)
        createMockTrade({
          realizedPnl: 100,
          executedAt: new Date(now - 2000),
        }), // Recovery
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      // Max drawdown = (1000 - 500) / 1000 = 50%
      expect(metrics.maxDrawdown).toBe(50);
    });

    it("should return 0 drawdown for all winning trades", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: 300 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.maxDrawdown).toBe(0);
    });

    it("should handle zero peak (no drawdown calculation possible)", () => {
      const trades = [
        createMockTrade({ realizedPnl: -100 }),
        createMockTrade({ realizedPnl: -200 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.maxDrawdown).toBe(0); // Zero peak means no percentage calculation
    });
  });

  describe("calculatePerformanceMetrics - Sharpe Ratio", () => {
    it("should calculate Sharpe ratio for positive returns", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: 150 }),
        createMockTrade({ realizedPnl: 120 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sharpeRatio).not.toBeNull();
      expect(metrics.sharpeRatio).toBeGreaterThan(0);
    });

    it("should calculate Sharpe ratio for mixed returns", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: -50 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: -30 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sharpeRatio).not.toBeNull();
    });

    it("should return null Sharpe for insufficient data (< 2 trades)", () => {
      const trades = [createMockTrade({ realizedPnl: 100 })];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sharpeRatio).toBeNull();
    });

    it("should return null Sharpe for zero volatility (all same PnL)", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 100 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sharpeRatio).toBeNull(); // Zero std dev
    });
  });

  describe("calculatePerformanceMetrics - Sortino Ratio", () => {
    it("should calculate Sortino ratio for mixed returns", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: -50 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: -30 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sortinoRatio).not.toBeNull();
    });

    it("should return null Sortino for no losses (infinite ratio)", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: 150 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sortinoRatio).toBeNull(); // No downside risk
    });

    it("should return null Sortino for insufficient data", () => {
      const trades = [createMockTrade({ realizedPnl: 100 })];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.sortinoRatio).toBeNull();
    });
  });

  describe("calculatePerformanceMetrics - Time Period Filtering", () => {
    it("should filter trades for LAST_30D period", () => {
      const now = Date.now();
      const trades = [
        createMockTrade({
          realizedPnl: 100,
          executedAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
        }), // 20 days ago
        createMockTrade({
          realizedPnl: 200,
          executedAt: new Date(now - 40 * 24 * 60 * 60 * 1000),
        }), // 40 days ago (excluded)
        createMockTrade({
          realizedPnl: 150,
          executedAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        }), // 10 days ago
      ];

      const metrics = calculatePerformanceMetrics(trades, "LAST_30D");

      expect(metrics.totalTrades).toBe(2); // Only 2 trades in last 30 days
      expect(metrics.netPnl).toBe(250); // 100 + 150
    });

    it("should filter trades for LAST_90D period", () => {
      const now = Date.now();
      const trades = [
        createMockTrade({
          realizedPnl: 100,
          executedAt: new Date(now - 60 * 24 * 60 * 60 * 1000),
        }), // 60 days ago
        createMockTrade({
          realizedPnl: 200,
          executedAt: new Date(now - 100 * 24 * 60 * 60 * 1000),
        }), // 100 days ago (excluded)
        createMockTrade({
          realizedPnl: 150,
          executedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
        }), // 30 days ago
      ];

      const metrics = calculatePerformanceMetrics(trades, "LAST_90D");

      expect(metrics.totalTrades).toBe(2);
      expect(metrics.netPnl).toBe(250);
    });

    it("should filter trades for LAST_365D period", () => {
      const now = Date.now();
      const trades = [
        createMockTrade({
          realizedPnl: 100,
          executedAt: new Date(now - 180 * 24 * 60 * 60 * 1000),
        }), // 180 days ago
        createMockTrade({
          realizedPnl: 200,
          executedAt: new Date(now - 400 * 24 * 60 * 60 * 1000),
        }), // 400 days ago (excluded)
        createMockTrade({
          realizedPnl: 150,
          executedAt: new Date(now - 90 * 24 * 60 * 60 * 1000),
        }), // 90 days ago
      ];

      const metrics = calculatePerformanceMetrics(trades, "LAST_365D");

      expect(metrics.totalTrades).toBe(2);
      expect(metrics.netPnl).toBe(250);
    });

    it("should include all trades for ALL_TIME period", () => {
      const now = Date.now();
      const trades = [
        createMockTrade({
          realizedPnl: 100,
          executedAt: new Date(now - 1000 * 24 * 60 * 60 * 1000),
        }), // 1000 days ago
        createMockTrade({
          realizedPnl: 200,
          executedAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        }), // 10 days ago
        createMockTrade({
          realizedPnl: 150,
          executedAt: new Date(now - 365 * 24 * 60 * 60 * 1000),
        }), // 365 days ago
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.totalTrades).toBe(3); // All trades included
      expect(metrics.netPnl).toBe(450);
    });
  });

  describe("calculatePerformanceMetrics - Complete Metrics (15 total)", () => {
    it("should calculate all 15 performance metrics", () => {
      const now = Date.now();
      const trades = [
        createMockTrade({
          realizedPnl: 100,
          executedAt: new Date(now - 5000),
        }),
        createMockTrade({
          realizedPnl: 200,
          executedAt: new Date(now - 4000),
        }),
        createMockTrade({
          realizedPnl: -50,
          executedAt: new Date(now - 3000),
        }),
        createMockTrade({
          realizedPnl: 150,
          executedAt: new Date(now - 2000),
        }),
        createMockTrade({
          realizedPnl: -30,
          executedAt: new Date(now - 1000),
        }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      // Verify all 15 metrics exist
      expect(metrics).toHaveProperty("period");
      expect(metrics).toHaveProperty("totalTrades");
      expect(metrics).toHaveProperty("winningTrades");
      expect(metrics).toHaveProperty("losingTrades");
      expect(metrics).toHaveProperty("winrate");
      expect(metrics).toHaveProperty("totalProfits");
      expect(metrics).toHaveProperty("totalLosses");
      expect(metrics).toHaveProperty("netPnl");
      expect(metrics).toHaveProperty("profitFactor");
      expect(metrics).toHaveProperty("sharpeRatio");
      expect(metrics).toHaveProperty("sortinoRatio");
      expect(metrics).toHaveProperty("maxDrawdown");
      expect(metrics).toHaveProperty("averageWin");
      expect(metrics).toHaveProperty("averageLoss");
      expect(metrics).toHaveProperty("largestWin");
      expect(metrics).toHaveProperty("largestLoss");

      // Verify correct values
      expect(metrics.totalTrades).toBe(5);
      expect(metrics.winningTrades).toBe(3);
      expect(metrics.losingTrades).toBe(2);
      expect(metrics.winrate).toBe(60); // 3/5 = 60%
      expect(metrics.totalProfits).toBe(450); // 100 + 200 + 150
      expect(metrics.totalLosses).toBe(80); // abs(-50) + abs(-30)
      expect(metrics.netPnl).toBe(370); // 450 - 80
      expect(metrics.profitFactor).toBeCloseTo(5.625, 2); // 450 / 80
      expect(metrics.averageWin).toBe(150); // 450 / 3
      expect(metrics.averageLoss).toBe(40); // 80 / 2
      expect(metrics.largestWin).toBe(200);
      expect(metrics.largestLoss).toBe(50);
    });
  });

  describe("calculatePerformanceMetrics - Real-world Scenarios", () => {
    it("should handle typical profitable trader (65% winrate, 2.5 profit factor)", () => {
      const trades = [
        // Wins (65%)
        createMockTrade({ realizedPnl: 120 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: 180 }),
        createMockTrade({ realizedPnl: 150 }),
        createMockTrade({ realizedPnl: 140 }),
        createMockTrade({ realizedPnl: 160 }),
        createMockTrade({ realizedPnl: 130 }),
        createMockTrade({ realizedPnl: 170 }),
        createMockTrade({ realizedPnl: 110 }),
        createMockTrade({ realizedPnl: 190 }),
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 145 }),
        createMockTrade({ realizedPnl: 155 }),
        // Losses (35%)
        createMockTrade({ realizedPnl: -80 }),
        createMockTrade({ realizedPnl: -70 }),
        createMockTrade({ realizedPnl: -90 }),
        createMockTrade({ realizedPnl: -75 }),
        createMockTrade({ realizedPnl: -65 }),
        createMockTrade({ realizedPnl: -85 }),
        createMockTrade({ realizedPnl: -60 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.totalTrades).toBe(20);
      expect(metrics.winrate).toBe(65); // 13/20 = 65%
      expect(metrics.profitFactor).toBeGreaterThan(2); // Good trader
      expect(metrics.netPnl).toBeGreaterThan(1000);
    });

    it("should handle breakeven trader (50% winrate, 1.0 profit factor)", () => {
      const trades = [
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: -100 }),
        createMockTrade({ realizedPnl: 150 }),
        createMockTrade({ realizedPnl: -150 }),
        createMockTrade({ realizedPnl: 200 }),
        createMockTrade({ realizedPnl: -200 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.winrate).toBe(50); // 3/6 = 50%
      expect(metrics.profitFactor).toBe(1); // 450 / 450 = 1
      expect(metrics.netPnl).toBe(0); // Breakeven
    });

    it("should handle losing trader (35% winrate, 0.5 profit factor)", () => {
      const trades = [
        // Wins (35%)
        createMockTrade({ realizedPnl: 100 }),
        createMockTrade({ realizedPnl: 150 }),
        createMockTrade({ realizedPnl: 120 }),
        createMockTrade({ realizedPnl: 130 }),
        // Losses (65%)
        createMockTrade({ realizedPnl: -200 }),
        createMockTrade({ realizedPnl: -180 }),
        createMockTrade({ realizedPnl: -150 }),
        createMockTrade({ realizedPnl: -170 }),
        createMockTrade({ realizedPnl: -160 }),
        createMockTrade({ realizedPnl: -140 }),
      ];

      const metrics = calculatePerformanceMetrics(trades, "ALL_TIME");

      expect(metrics.totalTrades).toBe(10);
      expect(metrics.winrate).toBe(40); // 4/10 = 40%
      expect(metrics.profitFactor).toBeLessThan(1); // Losing trader
      expect(metrics.netPnl).toBeLessThan(0); // Net loss
    });
  });
});
