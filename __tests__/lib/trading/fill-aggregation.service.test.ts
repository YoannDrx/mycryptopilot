/**
 * Fill Aggregation Service Tests
 *
 * Tests the critical aggregation logic including:
 * - Quantity tracking (entryQuantity, exitQuantity, netQuantity)
 * - Progressive PnL calculation for PARTIAL status
 * - DCA scenarios (multiple entry fills)
 * - Partial exits (multiple exit fills)
 * - Short positions
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
      create: vi.fn(),
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
    // Simple FIFO PnL calculation for testing
    const buyQueue: { quantity: number; price: number }[] = [];
    let realizedPnl = 0;

    for (const fill of fills) {
      if (fill.side === "BUY") {
        buyQueue.push({ quantity: fill.quantity, price: fill.price });
      } else {
        // SELL
        let remainingToSell = fill.quantity;
        while (remainingToSell > 0 && buyQueue.length > 0) {
          const oldestBuy = buyQueue[0];
          const soldQuantity = Math.min(remainingToSell, oldestBuy.quantity);
          const pnl = (fill.price - oldestBuy.price) * soldQuantity;
          realizedPnl += pnl;
          remainingToSell -= soldQuantity;
          oldestBuy.quantity -= soldQuantity;
          if (oldestBuy.quantity <= 0) {
            buyQueue.shift();
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

describe("FillAggregationService", () => {
  const traderProfileId = "trader-123";
  const connectionId = "connection-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for exchange connection
    vi.mocked(prisma.exchangeConnection.findUnique).mockResolvedValue({
      id: connectionId,
      traderProfileId,
      exchange: "BINANCE",
      mode: "SPOT",
      isActive: true,
      encryptedApiKey: "encrypted",
      keyIv: "iv",
      keyTag: "tag",
      encryptedSecretKey: "secret",
      testnet: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
  });

  describe("Quantity Tracking (Bug 2)", () => {
    it("should track entryQuantity, exitQuantity, netQuantity for LONG position", async () => {
      const fills = [
        createMockFill({ side: "BUY", quantity: 1.0, price: 100 }),
        createMockFill({ side: "BUY", quantity: 0.5, price: 105 }),
        createMockFill({ side: "SELL", quantity: 0.7, price: 110 }),
      ];

      // Mock session detection to return PARTIAL session
      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );
      vi.mocked(detectSessionsForTrader).mockResolvedValue([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "PARTIAL",
          fills: fills.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0.8, // 1.5 - 0.7
          averageEntry: 102,
          averageExit: 110,
          totalFees: 0,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
          realizedPnl: null,
        },
      ]);

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue(
        fills as never,
      );

      const mockCreatedTrade = {
        id: "trade-1",
        traderProfileId,
        source: "BINANCE",
        instrumentType: "SPOT",
        symbol: "BTC/USDT",
        status: "PARTIAL",
        side: "BUY",
        totalQuantity: new Decimal(1.5), // DEPRECATED: max(entry, exit)
        entryQuantity: new Decimal(1.5), // Total buys
        exitQuantity: new Decimal(0.7), // Total sells
        netQuantity: new Decimal(0.8), // 1.5 - 0.7
        averageEntry: new Decimal(102),
        averageExit: new Decimal(110),
        realizedPnl: new Decimal(5.6), // (110-102)*0.7
        fees: new Decimal(0),
        notes: null,
        stopLoss: null,
        takeProfit: null,
        openedAt: new Date(),
        closedAt: null,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue(
        mockCreatedTrade as never,
      );
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 3,
      } as never);

      await aggregateTraderFills(traderProfileId, fills);

      // Verify quantities were tracked correctly
      const createCall = vi.mocked(prisma.traderTrade.create).mock.calls[0][0];
      expect(createCall.data.entryQuantity).toBe(1.5); // 1.0 + 0.5
      expect(createCall.data.exitQuantity).toBe(0.7);
      expect(createCall.data.netQuantity).toBe(0.8); // 1.5 - 0.7
      expect(createCall.data.totalQuantity).toBe(1.5); // DEPRECATED: for backward compatibility
    });

    it("should track quantities correctly for SHORT position", async () => {
      const fills = [
        createMockFill({ side: "SELL", quantity: 1.0, price: 100 }),
        createMockFill({ side: "BUY", quantity: 0.3, price: 95 }),
      ];

      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );
      vi.mocked(detectSessionsForTrader).mockResolvedValue([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "SELL",
          status: "PARTIAL",
          fills: fills.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: -0.7, // 1.0 - 0.3
          averageEntry: 100,
          averageExit: 95,
          totalFees: 0,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
          realizedPnl: null,
        },
      ]);

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue(
        fills as never,
      );
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue({
        id: "trade-1",
      } as never);
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 2,
      } as never);

      await aggregateTraderFills(traderProfileId, fills);

      // For SHORT: entry = sells, exit = buys
      const createCall = vi.mocked(prisma.traderTrade.create).mock.calls[0][0];
      expect(createCall.data.entryQuantity).toBe(1.0); // SELL
      expect(createCall.data.exitQuantity).toBe(0.3); // BUY
      expect(createCall.data.netQuantity).toBe(0.7); // 1.0 - 0.3
    });
  });

  describe("Progressive PnL Calculation (Bug 3)", () => {
    it("should accumulate PnL progressively when updating PARTIAL position", async () => {
      // Scenario: User buys 1 BTC @ 100, then sells 0.5 @ 110
      // Later, buys 0.5 more @ 105, then sells 0.5 @ 115
      // PnL should accumulate: (110-100)*0.5 + (115-105)*0.5 = 5 + 5 = 10

      // First batch: Buy 1.0 @ 100, Sell 0.5 @ 110
      const firstBatch = [
        createMockFill({
          id: "fill-1",
          side: "BUY",
          quantity: 1.0,
          price: 100,
        }),
        createMockFill({
          id: "fill-2",
          side: "SELL",
          quantity: 0.5,
          price: 110,
        }),
      ];

      // Second batch: Buy 0.5 @ 105, Sell 0.5 @ 115
      const secondBatch = [
        createMockFill({
          id: "fill-3",
          side: "BUY",
          quantity: 0.5,
          price: 105,
        }),
        createMockFill({
          id: "fill-4",
          side: "SELL",
          quantity: 0.5,
          price: 115,
        }),
      ];

      const { detectSessionsForTrader } = await import(
        "@/lib/trading/session-detection.service"
      );

      // First aggregation: creates PARTIAL position
      vi.mocked(detectSessionsForTrader).mockResolvedValue([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "PARTIAL",
          fills: firstBatch.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0.5,
          averageEntry: 100,
          averageExit: 110,
          totalFees: 0,
          openedAt: new Date(),
          closedAt: null,
          lastActivityAt: new Date(),
          realizedPnl: null,
        },
      ]);

      vi.mocked(prisma.exchangeTrade.findMany).mockResolvedValue(
        firstBatch as never,
      );
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);

      const mockCreatedTrade = {
        id: "trade-1",
        traderProfileId,
        source: "BINANCE",
        instrumentType: "SPOT",
        symbol: "BTC/USDT",
        status: "PARTIAL",
        side: "BUY",
        totalQuantity: new Decimal(1.0),
        entryQuantity: new Decimal(1.0),
        exitQuantity: new Decimal(0.5),
        netQuantity: new Decimal(0.5),
        realizedPnl: new Decimal(5), // (110-100)*0.5
        lastActivityAt: new Date(),
      };

      vi.mocked(prisma.traderTrade.create).mockResolvedValue(
        mockCreatedTrade as never,
      );
      vi.mocked(prisma.exchangeTrade.updateMany).mockResolvedValue({
        count: 2,
      } as never);

      await aggregateTraderFills(traderProfileId, firstBatch);

      // First aggregation should have PnL = 5
      const createCall = vi.mocked(prisma.traderTrade.create).mock.calls[0][0];
      expect(createCall.data.realizedPnl).toBe(5); // (110-100)*0.5

      // Second aggregation: update existing PARTIAL position
      vi.mocked(detectSessionsForTrader).mockResolvedValue([
        {
          id: "session-1",
          symbol: "BTC/USDT",
          instrumentType: "SPOT",
          side: "BUY",
          status: "CLOSED",
          fills: secondBatch.map((f) => ({
            ...f,
            quantity: Number(f.quantity),
            price: Number(f.price),
            quoteQuantity: Number(f.quoteQuantity),
            fee: Number(f.fee),
            realizedPnl: null,
          })),
          totalQuantity: 0,
          averageEntry: 102.5,
          averageExit: 112.5,
          totalFees: 0,
          openedAt: new Date(),
          closedAt: new Date(),
          lastActivityAt: new Date(),
          realizedPnl: null,
        },
      ]);

      vi.mocked(prisma.exchangeTrade.findMany)
        .mockResolvedValueOnce(secondBatch as never) // New fills
        .mockResolvedValueOnce(firstBatch as never); // Existing fills for PnL recalculation

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(
        mockCreatedTrade as never,
      );

      const mockUpdatedTrade = {
        ...mockCreatedTrade,
        status: "CLOSED",
        entryQuantity: new Decimal(1.5),
        exitQuantity: new Decimal(1.0),
        netQuantity: new Decimal(0.5),
        realizedPnl: new Decimal(10), // (110-100)*0.5 + (115-105)*0.5
      };

      vi.mocked(prisma.traderTrade.update).mockResolvedValue(
        mockUpdatedTrade as never,
      );

      await aggregateTraderFills(traderProfileId, secondBatch);

      // Second aggregation should have CUMULATIVE PnL = 10
      expect(prisma.traderTrade.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            realizedPnl: 10, // Cumulative PnL from ALL fills
          }),
        }),
      );
    });
  });
});

// Helper to create mock fill
function createMockFill(
  overrides: {
    id?: string;
    side?: "BUY" | "SELL";
    quantity?: number;
    price?: number;
    quoteQuantity?: number;
    fee?: number;
    symbol?: string;
  } = {},
): ExchangeTrade {
  return {
    id: overrides.id ?? `fill-${Math.random()}`,
    connectionId: "connection-123",
    traderTradeId: null,
    externalOrderId: "order-123",
    symbol: overrides.symbol ?? "BTC/USDT",
    side: overrides.side ?? "BUY",
    type: "LIMIT",
    quantity: new Decimal(overrides.quantity ?? 1.0),
    price: new Decimal(overrides.price ?? 100),
    quoteQuantity: new Decimal(
      overrides.quoteQuantity ?? overrides.price ?? 100,
    ),
    fee: new Decimal(overrides.fee ?? 0.1),
    feeCurrency: "USDT",
    realizedPnl: null,
    executedAt: new Date(),
    createdAt: new Date(),
  } as unknown as ExchangeTrade;
}
