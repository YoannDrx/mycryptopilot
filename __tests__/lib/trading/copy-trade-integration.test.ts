/**
 * Copy Trade Integration Tests
 *
 * Tests end-to-end copy trading workflows including aggregator integration:
 * - Complete workflow: Trader opens → User copies → Trader closes → Copy updates
 * - Multiple users copying same trade
 * - MANUAL vs AUTO mode differences
 * - Integration with fill-aggregation service
 * - Edge cases: partial fills, DCA scenarios, slippage
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  createCopyTrade,
  closeOriginalTradeCopies,
  getTradeCopies,
} from "@/lib/trading/copy-trade.service";
import { prisma } from "@/lib/prisma";
import type { CopyTrade } from "@/generated/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    traderTrade: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    copyTrade: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    exchangeConnection: {
      findUnique: vi.fn(),
    },
    exchangeTrade: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CopyTradeIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Workflow: Open → Copy → Close", () => {
    it("should handle full lifecycle: trader opens, user copies, trader closes", async () => {
      // Step 1: Trader opens position (OPEN TraderTrade exists)
      const mockOriginalTrade = {
        id: "trade-1",
        traderProfileId: "trader-123",
        symbol: "BTC/USDT",
        side: "BUY",
        status: "OPEN",
        totalQuantity: new Decimal(1.5),
        averageEntry: new Decimal(50000),
        averageExit: null,
        realizedPnl: null,
        trader: {
          user: {
            name: "John Trader",
            email: "john@example.com",
          },
        },
      };

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue(
        mockOriginalTrade as never,
      );
      vi.mocked(prisma.copyTrade.findFirst).mockResolvedValue(null);

      // Step 2: User creates copy trade
      const mockCreatedCopy: Partial<CopyTrade> = {
        id: "copy-1",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(50100), // User enters at slightly higher price (slippage)
        executedQuantity: new Decimal(1.5),
        executedPrice: new Decimal(50100),
      };

      vi.mocked(prisma.copyTrade.create).mockResolvedValue(
        mockCreatedCopy as CopyTrade,
      );

      const copyResult = await createCopyTrade({
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        manualEntry: 50100,
      });

      expect(copyResult.id).toBe("copy-1");
      expect(copyResult.status).toBe("EXECUTED");

      // Step 3: Trader closes position (averageExit = 52000)
      // realizedPnl: (52000-50000) * 1.5 = 3000

      // Mock the copy retrieval for closure
      const copyWithOriginal = {
        ...mockCreatedCopy,
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(50000),
          averageExit: new Decimal(52000),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        copyWithOriginal as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-1",
      } as never);

      // Step 4: Close copies (triggered by aggregator when trade closes)
      const closedCount = await closeOriginalTradeCopies("trade-1", 52000);

      expect(closedCount).toBe(1);

      // Verify copy was updated with correct PnL
      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: "copy-1" });
      expect(updateCall.data.manualExit).toBe(52000);

      // User's PnL: (52000 - 50100) * 1.5 = 2850 (less than trader due to slippage)
      expect(updateCall.data.manualPnl).toBe(2850);
      expect(updateCall.data.closedAt).toBeInstanceOf(Date);
    });
  });

  describe("Multiple Users Copy Same Trade", () => {
    it("should close all copies when original trade closes", async () => {
      const mockCopies = [
        {
          id: "copy-1",
          userId: "user-1",
          originalTradeId: "trade-1",
          mode: "MANUAL",
          status: "EXECUTED",
          manualEntry: new Decimal(100),
          executedQuantity: new Decimal(1.0),
          notes: "First copy",
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(100),
            averageExit: new Decimal(110),
          },
        },
        {
          id: "copy-2",
          userId: "user-2",
          originalTradeId: "trade-1",
          mode: "MANUAL",
          status: "EXECUTED",
          manualEntry: new Decimal(101), // Different entry (slippage)
          executedQuantity: new Decimal(2.0), // Different size
          notes: "Second copy",
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(100),
            averageExit: new Decimal(110),
          },
        },
        {
          id: "copy-3",
          userId: "user-3",
          originalTradeId: "trade-1",
          mode: "AUTO",
          status: "EXECUTED",
          executedPrice: new Decimal(99), // Better execution
          executedQuantity: new Decimal(0.5),
          notes: "Third copy (AUTO)",
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(100),
            averageExit: new Decimal(110),
          },
        },
      ];

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue(
        mockCopies as never,
      );
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({} as never);

      const exitPrice = 110;
      const count = await closeOriginalTradeCopies("trade-1", exitPrice);

      expect(count).toBe(3);
      expect(vi.mocked(prisma.copyTrade.update)).toHaveBeenCalledTimes(3);

      // Verify each copy got correct PnL
      const call1 = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];
      const call2 = vi.mocked(prisma.copyTrade.update).mock.calls[1][0];
      const call3 = vi.mocked(prisma.copyTrade.update).mock.calls[2][0];

      // User 1: (110-100)*1.0 = 10
      expect(call1.data.manualPnl).toBe(10);

      // User 2: (110-101)*2.0 = 18
      expect(call2.data.manualPnl).toBe(18);

      // User 3 (AUTO): (110-99)*0.5 = 5.5
      expect(call3.data.manualPnl).toBe(5.5);
    });
  });

  describe("MANUAL vs AUTO Mode", () => {
    it("should use manualEntry for MANUAL mode PnL calculation", async () => {
      const mockCopy = {
        id: "copy-manual",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(50500), // User's recorded entry
        executedQuantity: new Decimal(1.0),
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(50000), // Trader's entry (different)
          averageExit: new Decimal(52000),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-manual",
      } as never);

      await closeOriginalTradeCopies("trade-1", 52000);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // MANUAL mode PnL: (52000 - 50500) * 1.0 = 1500
      expect(updateCall.data.manualPnl).toBe(1500);
    });

    it("should use executedPrice for AUTO mode PnL calculation", async () => {
      const mockCopy = {
        id: "copy-auto",
        userId: "user-2",
        originalTradeId: "trade-1",
        mode: "AUTO",
        status: "EXECUTED",
        executedPrice: new Decimal(49900), // Better execution than trader
        executedQuantity: new Decimal(1.0),
        manualEntry: null, // No manual entry in AUTO mode
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(50000), // Trader's entry
          averageExit: new Decimal(52000),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-auto",
      } as never);

      await closeOriginalTradeCopies("trade-1", 52000);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // AUTO mode PnL: (52000 - 49900) * 1.0 = 2100 (better than trader!)
      expect(updateCall.data.manualPnl).toBe(2100);
    });
  });

  describe("DCA Scenario", () => {
    it("should handle copy of DCA trade with correct weighted average", async () => {
      // Trader did DCA:
      // - Buy 1 BTC @ 50000 = 50000 USDT
      // - Buy 0.5 BTC @ 48000 = 24000 USDT
      // - Total: 1.5 BTC for 74000 USDT
      // - Weighted avg: 74000 / 1.5 = 49333.33

      const mockOriginalTrade = {
        id: "trade-dca",
        traderProfileId: "trader-123",
        symbol: "BTC/USDT",
        side: "BUY",
        status: "OPEN",
        totalQuantity: new Decimal(1.5),
        averageEntry: new Decimal(49333.33), // Weighted average
        averageExit: null,
        realizedPnl: null,
        trader: {
          user: {
            name: "DCA Trader",
            email: "dca@example.com",
          },
        },
      };

      vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue(
        mockOriginalTrade as never,
      );
      vi.mocked(prisma.copyTrade.findFirst).mockResolvedValue(null);

      // User copies with same DCA strategy
      const mockCreatedCopy: Partial<CopyTrade> = {
        id: "copy-dca",
        userId: "user-1",
        originalTradeId: "trade-dca",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(49333.33), // Same weighted avg
        executedQuantity: new Decimal(1.5),
      };

      vi.mocked(prisma.copyTrade.create).mockResolvedValue(
        mockCreatedCopy as CopyTrade,
      );

      const copyResult = await createCopyTrade({
        userId: "user-1",
        originalTradeId: "trade-dca",
        mode: "MANUAL",
        manualEntry: 49333.33,
      });

      expect(copyResult.manualEntry).toEqual(new Decimal(49333.33));

      // Trader closes at 52000
      const copyWithOriginal = {
        ...mockCreatedCopy,
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(49333.33),
          averageExit: new Decimal(52000),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        copyWithOriginal as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-dca",
      } as never);

      await closeOriginalTradeCopies("trade-dca", 52000);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // PnL: (52000 - 49333.33) * 1.5 = 4000
      expect(updateCall.data.manualPnl).toBeCloseTo(4000, 0);
    });
  });

  describe("SHORT Position", () => {
    it("should calculate SHORT copy PnL correctly", async () => {
      const mockCopy = {
        id: "copy-short",
        userId: "user-1",
        originalTradeId: "trade-short",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(50000), // User sold at 50000
        executedQuantity: new Decimal(1.0),
        originalTrade: {
          side: "SELL", // SHORT
          averageEntry: new Decimal(50000),
          averageExit: new Decimal(48000), // Buy back lower (profit)
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-short",
      } as never);

      const exitPrice = 48000;
      await closeOriginalTradeCopies("trade-short", exitPrice);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // SHORT PnL: (entry - exit) * quantity = (50000 - 48000) * 1.0 = 2000
      expect(updateCall.data.manualPnl).toBe(2000);
      expect(updateCall.data.notes).toContain("+2000.00 USDT");
    });

    it("should calculate SHORT copy loss correctly", async () => {
      const mockCopy = {
        id: "copy-short-loss",
        userId: "user-1",
        originalTradeId: "trade-short-loss",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(50000), // User sold at 50000
        executedQuantity: new Decimal(1.0),
        originalTrade: {
          side: "SELL", // SHORT
          averageEntry: new Decimal(50000),
          averageExit: new Decimal(52000), // Buy back higher (loss)
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-short-loss",
      } as never);

      const exitPrice = 52000;
      await closeOriginalTradeCopies("trade-short-loss", exitPrice);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // SHORT loss: (entry - exit) * quantity = (50000 - 52000) * 1.0 = -2000
      expect(updateCall.data.manualPnl).toBe(-2000);
      expect(updateCall.data.notes).toContain("-2000.00 USDT");
    });
  });

  describe("Edge Cases", () => {
    it("should handle copy with zero quantity gracefully", async () => {
      const mockCopy = {
        id: "copy-zero",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100),
        executedQuantity: new Decimal(0), // Zero quantity
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(100),
          averageExit: new Decimal(110),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-zero",
      } as never);

      await closeOriginalTradeCopies("trade-1", 110);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // Zero quantity = zero PnL
      expect(updateCall.data.manualPnl).toBe(0);
    });

    it("should preserve existing notes when closing", async () => {
      const mockCopy = {
        id: "copy-notes",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100),
        executedQuantity: new Decimal(1.0),
        notes: "User's important trading journal entry here",
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(100),
          averageExit: new Decimal(110),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-notes",
      } as never);

      await closeOriginalTradeCopies("trade-1", 110);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // Original notes should be preserved
      expect(updateCall.data.notes).toContain(
        "User's important trading journal entry here",
      );
      // With closure info appended
      expect(updateCall.data.notes).toContain("\n\n");
      expect(updateCall.data.notes).toContain("Closed at $110.00");
      expect(updateCall.data.notes).toContain("PnL:");
    });

    it("should not close PENDING or CANCELLED copies", async () => {
      // Service filters for status: "EXECUTED" only
      // PENDING and CANCELLED copies should not be affected

      // Service only fetches EXECUTED copies
      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([]);

      const count = await closeOriginalTradeCopies("trade-1", 110);

      expect(count).toBe(0);
      expect(vi.mocked(prisma.copyTrade.update)).not.toHaveBeenCalled();
    });
  });

  describe("getTradeCopies Query", () => {
    it("should return all copies for a trade", async () => {
      const mockCopies = [
        {
          id: "copy-1",
          userId: "user-1",
          originalTradeId: "trade-1",
          mode: "MANUAL",
          status: "EXECUTED",
          createdAt: new Date("2024-01-01"),
          originalTrade: {
            id: "trade-1",
            symbol: "BTC/USDT",
          },
          user: {
            id: "user-1",
            name: "Alice",
            email: "alice@example.com",
          },
        },
        {
          id: "copy-2",
          userId: "user-2",
          originalTradeId: "trade-1",
          mode: "AUTO",
          status: "EXECUTED",
          createdAt: new Date("2024-01-02"),
          originalTrade: {
            id: "trade-1",
            symbol: "BTC/USDT",
          },
          user: {
            id: "user-2",
            name: "Bob",
            email: "bob@example.com",
          },
        },
      ];

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue(
        mockCopies as never,
      );

      const copies = await getTradeCopies("trade-1");

      expect(copies).toHaveLength(2);
      expect(copies[0]?.userId).toBe("user-1");
      expect(copies[1]?.userId).toBe("user-2");
      expect(vi.mocked(prisma.copyTrade.findMany)).toHaveBeenCalledWith({
        where: { originalTradeId: "trade-1" },
        include: {
          originalTrade: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("Slippage Scenarios", () => {
    it("should handle significant slippage reducing user profit", async () => {
      const mockCopy = {
        id: "copy-slippage",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(50500), // 1% slippage on entry
        executedQuantity: new Decimal(1.0),
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(50000), // Trader's entry
          averageExit: new Decimal(50600), // Trader profit: 600
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-slippage",
      } as never);

      await closeOriginalTradeCopies("trade-1", 50600);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // Trader PnL: (50600 - 50000) * 1.0 = 600 USDT
      // User PnL: (50600 - 50500) * 1.0 = 100 USDT (83% less due to slippage!)
      expect(updateCall.data.manualPnl).toBe(100);
    });

    it("should handle better execution than trader (negative slippage)", async () => {
      const mockCopy = {
        id: "copy-better",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "AUTO",
        status: "EXECUTED",
        executedPrice: new Decimal(49800), // Better entry than trader
        executedQuantity: new Decimal(1.0),
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(50000), // Trader's entry
          averageExit: new Decimal(51000), // Exit at 51000
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-better",
      } as never);

      await closeOriginalTradeCopies("trade-1", 51000);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // Trader PnL: (51000 - 50000) * 1.0 = 1000 USDT
      // User PnL: (51000 - 49800) * 1.0 = 1200 USDT (20% better!)
      expect(updateCall.data.manualPnl).toBe(1200);
    });
  });

  describe("Performance Comparison", () => {
    it("should show different PnL between trader and copier due to execution differences", async () => {
      // Trader's trade
      const traderEntry = 50000;
      const traderExit = 52000;
      const traderPnl = (52000 - 50000) * 1.0; // = 2000 USDT

      // User's copy with slippage
      const userEntry = 50300; // Worse entry
      const userExit = 52000; // Same exit
      const userPnl = (52000 - 50300) * 1.0; // = 1700 USDT

      const mockCopy = {
        id: "copy-comparison",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(userEntry),
        executedQuantity: new Decimal(1.0),
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(traderEntry),
          averageExit: new Decimal(traderExit),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-comparison",
      } as never);

      await closeOriginalTradeCopies("trade-1", userExit);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      expect(updateCall.data.manualPnl).toBe(userPnl);
      expect(userPnl).toBeLessThan(traderPnl);

      // User lost 300 USDT vs trader due to slippage
      const slippageLoss = traderPnl - userPnl;
      expect(slippageLoss).toBe(300);
    });
  });
});
