/**
 * Aggregator End-to-End Tests
 *
 * Tests the complete workflow from ExchangeTrades to TraderTrades with CopyTrade propagation:
 * 1. ExchangeTrade fills arrive from exchange
 * 2. Session detection groups fills into sessions
 * 3. Fill aggregation creates/updates TraderTrades
 * 4. When TraderTrade closes, CopyTrades are automatically updated
 *
 * Scenarios:
 * - Simple open → close workflow
 * - DCA (multiple entries) → close
 * - Open → partial exit → full close
 * - Short position workflow
 * - Multiple users copying with propagation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import type { ExchangeTrade } from "@/generated/prisma";
import { aggregateTraderFills } from "@/lib/trading/fill-aggregation.service";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    exchangeTrade: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    exchangeConnection: {
      findUnique: vi.fn(),
    },
    traderTrade: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    copyTrade: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock session detection service
vi.mock("@/lib/trading/session-detection.service", () => ({
  detectSessionsForTrader: vi.fn(),
  findUnassignedFills: (fills: ExchangeTrade[]) =>
    fills.filter((f) => !f.traderTradeId),
  calculateSessionStats: vi.fn(() => ({
    totalSessions: 1,
    openSessions: 0,
    closedSessions: 1,
    partialSessions: 0,
  })),
}));

// Mock PnL calculator service
vi.mock("@/lib/trading/pnl-calculator.service", () => ({
  calculateSpotPnL: vi.fn((fills) => {
    // Simple FIFO PnL calculation
    const buyQueue: { quantity: number; price: number }[] = [];
    let realizedPnl = 0;

    for (const fill of fills) {
      if (fill.side === "BUY") {
        buyQueue.push({ quantity: fill.quantity, price: fill.price });
      } else {
        let remainingToSell = fill.quantity;
        while (remainingToSell > 0) {
          const oldestBuy = buyQueue.shift();
          if (!oldestBuy) break;
          const soldQuantity = Math.min(remainingToSell, oldestBuy.quantity);
          const pnl = (fill.price - oldestBuy.price) * soldQuantity;
          realizedPnl += pnl;
          remainingToSell -= soldQuantity;
          oldestBuy.quantity -= soldQuantity;
          if (oldestBuy.quantity > 0) {
            buyQueue.unshift(oldestBuy);
            break;
          }
        }
      }
    }

    return { realizedPnl, method: "FIFO" as const };
  }),
  calculateFuturesPnL: vi.fn(() => ({
    realizedPnl: 0,
    method: "NATIVE" as const,
  })),
}));

/**
 * Helper: Create mock ExchangeTrade
 */
function createMockFill(
  partial: Omit<Partial<ExchangeTrade>, "quantity" | "price"> & {
    side: "BUY" | "SELL";
    quantity: number;
    price: number;
  },
): ExchangeTrade {
  const id = partial.id ?? `fill-${Date.now()}-${Math.random()}`;
  const timestamp = partial.executedAt ?? new Date();

  return {
    id,
    connectionId: partial.connectionId ?? "connection-123",
    traderTradeId: partial.traderTradeId ?? null,
    externalOrderId: partial.externalOrderId ?? `order-${id}`,
    symbol: partial.symbol ?? "BTC/USDT",
    side: partial.side,
    type: partial.type ?? "MARKET",
    quantity: new Decimal(partial.quantity),
    price: new Decimal(partial.price),
    quoteQuantity: new Decimal(partial.quantity * partial.price),
    fee: new Decimal(partial.fee ?? 0),
    feeAsset: partial.feeAsset ?? "USDT",
    realizedPnl: partial.realizedPnl ? new Decimal(partial.realizedPnl) : null,
    executedAt: timestamp,
    createdAt: partial.createdAt ?? timestamp,
  } as ExchangeTrade;
}

describe("AggregatorE2E", () => {
  const traderProfileId = "trader-123";
  const connectionId = "connection-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for exchange connection
    vi.mocked(prisma.exchangeConnection.findUnique).mockResolvedValue({
      id: connectionId,
      traderProfileId,
      exchange: "BINANCE",
    } as never);
  });

  describe("Simple Workflow: Open → Close", () => {
    it("should aggregate entry fills → create TraderTrade OPEN → close → update CLOSED", async () => {
      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );

      // Step 1: Entry fills arrive
      const entryFills = [
        createMockFill({
          side: "BUY",
          quantity: 1.0,
          price: 50000,
          id: "fill-1",
        }),
      ];

      // Mock OPEN session
      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "OPEN",
          fills: entryFills.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 1.0,
          averageEntry: 50000,
          averageExit: null,
          totalFees: 0,
          realizedPnl: null,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue({
        id: "trade-1",
        traderProfileId,
        symbol: "BTC/USDT",
        side: "BUY",
        status: "OPEN",
        totalQuantity: new Decimal(1.0),
        entryQuantity: new Decimal(1.0),
        exitQuantity: new Decimal(0),
        netQuantity: new Decimal(1.0),
        averageEntry: new Decimal(50000),
        averageExit: null,
        realizedPnl: null,
        fees: new Decimal(0),
        openedAt: new Date(),
        closedAt: null,
        lastActivityAt: new Date(),
      } as never);
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 1,
      } as never);

      const result1 = await aggregateTraderFills(traderProfileId, entryFills);

      expect(result1.traderTrade).toBeTruthy();
      expect(result1.traderTrade?.status).toBe("OPEN");
      expect(Number(result1.traderTrade?.averageEntry)).toBe(50000);
      expect(result1.fillsProcessed).toBe(1);
      expect(result1.sessionsCreated).toBe(1);

      // Step 2: Exit fills arrive
      const exitFills = [
        createMockFill({
          side: "SELL",
          quantity: 1.0,
          price: 52000,
          id: "fill-2",
        }),
      ];

      // Mock all existing fills for PnL recalculation
      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entryFills,
        ...exitFills,
      ]);

      // Mock CLOSED session (with ALL fills)
      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "CLOSED",
          fills: [...entryFills, ...exitFills].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0, // Net = 0
          averageEntry: 50000,
          averageExit: 52000,
          totalFees: 0,
          realizedPnl: 2000, // (52000-50000)*1.0
          openedAt: new Date(),
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-1",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue({
        id: "trade-1",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-1",
        traderProfileId,
        symbol: "BTC/USDT",
        side: "BUY",
        status: "CLOSED",
        totalQuantity: new Decimal(1.0),
        entryQuantity: new Decimal(1.0),
        exitQuantity: new Decimal(1.0),
        netQuantity: new Decimal(0),
        averageEntry: new Decimal(50000),
        averageExit: new Decimal(52000),
        realizedPnl: new Decimal(2000),
        fees: new Decimal(0),
        openedAt: new Date(),
        closedAt: new Date(),
        lastActivityAt: new Date(),
      } as never);

      // Mock copy trades for closure
      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([]);

      const result2 = await aggregateTraderFills(traderProfileId, exitFills);

      expect(result2.traderTrade).toBeTruthy();
      expect(result2.traderTrade?.status).toBe("CLOSED");
      expect(Number(result2.traderTrade?.averageExit)).toBe(52000);
      expect(Number(result2.traderTrade?.realizedPnl)).toBe(2000);
    });
  });

  describe("DCA Workflow: Multiple Entries → Close", () => {
    it("should aggregate DCA entries → calculate weighted average → close with correct PnL", async () => {
      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );

      // Step 1: First entry
      const entry1 = [
        createMockFill({
          side: "BUY",
          quantity: 1.0,
          price: 50000,
          id: "fill-1",
        }),
      ];

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "OPEN",
          fills: entry1.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 1.0,
          averageEntry: 50000,
          averageExit: null,
          totalFees: 0,
          realizedPnl: null,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue({
        id: "trade-dca",
        status: "OPEN",
        averageEntry: new Decimal(50000),
      } as never);
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 1,
      } as never);

      await aggregateTraderFills(traderProfileId, entry1);

      // Step 2: Second entry (DCA)
      const entry2 = [
        createMockFill({
          side: "BUY",
          quantity: 0.5,
          price: 48000,
          id: "fill-2",
        }),
      ];

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entry1,
        ...entry2,
      ]);

      // Weighted avg: (1.0*50000 + 0.5*48000) / 1.5 = 49333.33
      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "OPEN",
          fills: [...entry1, ...entry2].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 1.5,
          averageEntry: 49333.33,
          averageExit: null,
          totalFees: 0,
          realizedPnl: null,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-dca",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue({
        id: "trade-dca",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-dca",
        status: "OPEN",
        averageEntry: new Decimal(49333.33),
        entryQuantity: new Decimal(1.5),
      } as never);

      const result2 = await aggregateTraderFills(traderProfileId, entry2);

      expect(result2.traderTrade).toBeTruthy();
      expect(Number(result2.traderTrade?.averageEntry)).toBeCloseTo(
        49333.33,
        2,
      );

      // Step 3: Exit all
      const exit = [
        createMockFill({
          side: "SELL",
          quantity: 1.5,
          price: 52000,
          id: "fill-3",
        }),
      ];

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entry1,
        ...entry2,
        ...exit,
      ]);

      // PnL: (52000 - 49333.33) * 1.5 = 4000
      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "CLOSED",
          fills: [...entry1, ...entry2, ...exit].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0,
          averageEntry: 49333.33,
          averageExit: 52000,
          totalFees: 0,
          realizedPnl: 4000,
          openedAt: new Date(),
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-dca",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-dca",
        status: "CLOSED",
        averageEntry: new Decimal(49333.33),
        averageExit: new Decimal(52000),
        realizedPnl: new Decimal(4000),
      } as never);

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([]);

      const result3 = await aggregateTraderFills(traderProfileId, exit);

      expect(result3.traderTrade?.status).toBe("CLOSED");
      expect(Number(result3.traderTrade?.realizedPnl)).toBeCloseTo(4000, 0);
    });
  });

  describe("Partial Exit Workflow", () => {
    it("should handle OPEN → PARTIAL → CLOSED transitions", async () => {
      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );

      // Step 1: Open position (2 BTC)
      const entry = [
        createMockFill({
          side: "BUY",
          quantity: 2.0,
          price: 50000,
          id: "fill-1",
        }),
      ];

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "OPEN",
          fills: entry.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 2.0,
          averageEntry: 50000,
          averageExit: null,
          totalFees: 0,
          realizedPnl: null,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue({
        id: "trade-partial",
        status: "OPEN",
        entryQuantity: new Decimal(2.0),
        exitQuantity: new Decimal(0),
        netQuantity: new Decimal(2.0),
      } as never);
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 1,
      } as never);

      await aggregateTraderFills(traderProfileId, entry);

      // Step 2: Partial exit (1 BTC)
      const partialExit = [
        createMockFill({
          side: "SELL",
          quantity: 1.0,
          price: 51000,
          id: "fill-2",
        }),
      ];

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entry,
        ...partialExit,
      ]);

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "PARTIAL",
          fills: [...entry, ...partialExit].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 1.0, // 2.0 - 1.0
          averageEntry: 50000,
          averageExit: 51000,
          totalFees: 0,
          realizedPnl: 1000, // (51000-50000)*1.0
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-partial",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue({
        id: "trade-partial",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-partial",
        status: "PARTIAL",
        entryQuantity: new Decimal(2.0),
        exitQuantity: new Decimal(1.0),
        netQuantity: new Decimal(1.0),
        realizedPnl: new Decimal(1000),
      } as never);

      const result2 = await aggregateTraderFills(traderProfileId, partialExit);

      expect(result2.traderTrade?.status).toBe("PARTIAL");
      expect(Number(result2.traderTrade?.netQuantity)).toBe(1.0);
      expect(Number(result2.traderTrade?.realizedPnl)).toBe(1000);

      // Step 3: Close remaining (1 BTC)
      const finalExit = [
        createMockFill({
          side: "SELL",
          quantity: 1.0,
          price: 52000,
          id: "fill-3",
        }),
      ];

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entry,
        ...partialExit,
        ...finalExit,
      ]);

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "CLOSED",
          fills: [...entry, ...partialExit, ...finalExit].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0, // Fully closed
          averageEntry: 50000,
          averageExit: 51500, // (51000*1 + 52000*1) / 2
          totalFees: 0,
          realizedPnl: 3000, // (51000-50000)*1.0 + (52000-50000)*1.0
          openedAt: new Date(),
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-partial",
        status: "PARTIAL",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-partial",
        status: "CLOSED",
        entryQuantity: new Decimal(2.0),
        exitQuantity: new Decimal(2.0),
        netQuantity: new Decimal(0),
        realizedPnl: new Decimal(3000),
      } as never);

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([]);

      const result3 = await aggregateTraderFills(traderProfileId, finalExit);

      expect(result3.traderTrade?.status).toBe("CLOSED");
      expect(Number(result3.traderTrade?.netQuantity)).toBe(0);
      expect(Number(result3.traderTrade?.realizedPnl)).toBe(3000);
    });
  });

  describe("SHORT Position Workflow", () => {
    it("should handle SHORT: SELL entry → BUY exit with correct PnL", async () => {
      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );

      // Step 1: SHORT entry (SELL)
      const entry = [
        createMockFill({
          side: "SELL",
          quantity: 1.0,
          price: 50000,
          id: "fill-short-1",
        }),
      ];

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-short",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "SELL",
          status: "OPEN",
          fills: entry.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 1.0,
          averageEntry: 50000,
          averageExit: null,
          totalFees: 0,
          realizedPnl: null,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue({
        id: "trade-short",
        side: "SELL",
        status: "OPEN",
        averageEntry: new Decimal(50000),
      } as never);
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 1,
      } as never);

      await aggregateTraderFills(traderProfileId, entry);

      // Step 2: SHORT exit (BUY back at lower price = profit)
      const exit = [
        createMockFill({
          side: "BUY",
          quantity: 1.0,
          price: 48000,
          id: "fill-short-2",
        }),
      ];

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entry,
        ...exit,
      ]);

      // SHORT profit: (50000 - 48000) * 1.0 = 2000
      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-short",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "SELL",
          status: "CLOSED",
          fills: [...entry, ...exit].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0,
          averageEntry: 50000,
          averageExit: 48000,
          totalFees: 0,
          realizedPnl: 2000,
          openedAt: new Date(),
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-short",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue({
        id: "trade-short",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-short",
        side: "SELL",
        status: "CLOSED",
        averageEntry: new Decimal(50000),
        averageExit: new Decimal(48000),
        realizedPnl: new Decimal(2000),
      } as never);

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([]);

      const result = await aggregateTraderFills(traderProfileId, exit);

      expect(result.traderTrade?.status).toBe("CLOSED");
      expect(Number(result.traderTrade?.realizedPnl)).toBe(2000);
    });
  });

  describe("Copy Trade Propagation (Integration)", () => {
    it("should propagate CLOSED status to all CopyTrades when TraderTrade closes", async () => {
      // This test verifies the integration between aggregator and copy trading
      // When aggregator updates a TraderTrade to CLOSED, it should call closeOriginalTradeCopies

      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );

      // Step 1: Trader opens position
      const entry = [
        createMockFill({
          side: "BUY",
          quantity: 1.0,
          price: 50000,
          id: "fill-1",
        }),
      ];

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "OPEN",
          fills: entry.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 1.0,
          averageEntry: 50000,
          averageExit: null,
          totalFees: 0,
          realizedPnl: null,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue({
        id: "trade-with-copies",
        status: "OPEN",
      } as never);
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 1,
      } as never);

      await aggregateTraderFills(traderProfileId, entry);

      // Users copy this trade (2 users)
      const mockCopies = [
        {
          id: "copy-1",
          userId: "user-1",
          originalTradeId: "trade-with-copies",
          mode: "MANUAL",
          status: "EXECUTED",
          manualEntry: new Decimal(50100),
          executedQuantity: new Decimal(1.0),
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(50000),
            averageExit: new Decimal(52000),
          },
        },
        {
          id: "copy-2",
          userId: "user-2",
          originalTradeId: "trade-with-copies",
          mode: "MANUAL",
          status: "EXECUTED",
          manualEntry: new Decimal(50200),
          executedQuantity: new Decimal(0.5),
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(50000),
            averageExit: new Decimal(52000),
          },
        },
      ];

      // Step 2: Trader closes position
      const exit = [
        createMockFill({
          side: "SELL",
          quantity: 1.0,
          price: 52000,
          id: "fill-2",
        }),
      ];

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue([
        ...entry,
        ...exit,
      ]);

      vi.mocked(detectSessionsForTrader).mockResolvedValueOnce([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "CLOSED",
          fills: [...entry, ...exit].map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0,
          averageEntry: 50000,
          averageExit: 52000,
          totalFees: 0,
          realizedPnl: 2000,
          openedAt: new Date(),
          closedAt: new Date(),
          lastActivityAt: new Date(),
        },
      ]);

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue({
        id: "trade-with-copies",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue({
        id: "trade-with-copies",
        status: "OPEN",
        lastActivityAt: new Date(),
      } as never);

      vi.mocked(prisma.traderTrade.update).mockResolvedValue({
        id: "trade-with-copies",
        status: "CLOSED",
        averageExit: new Decimal(52000),
      } as never);

      // Mock copy trades retrieval
      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue(
        mockCopies as never,
      );
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({} as never);

      // Aggregate and trigger propagation
      await aggregateTraderFills(traderProfileId, exit);

      // Verify copies were updated
      expect(vi.mocked(prisma.copyTrade.findMany)).toHaveBeenCalledWith({
        where: {
          originalTradeId: "trade-with-copies",
          status: "EXECUTED",
        },
        include: {
          originalTrade: {
            select: {
              side: true,
              averageEntry: true,
              averageExit: true,
            },
          },
        },
      });

      // Verify both copies got updated (2 calls)
      expect(vi.mocked(prisma.copyTrade.update)).toHaveBeenCalledTimes(2);

      // Verify PnL calculations
      const call1 = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];
      const call2 = vi.mocked(prisma.copyTrade.update).mock.calls[1][0];

      // User 1: (52000 - 50100) * 1.0 = 1900
      expect(call1.data.manualPnl).toBe(1900);
      expect(call1.data.manualExit).toBe(52000);

      // User 2: (52000 - 50200) * 0.5 = 900
      expect(call2.data.manualPnl).toBe(900);
      expect(call2.data.manualExit).toBe(52000);
    });
  });
});
