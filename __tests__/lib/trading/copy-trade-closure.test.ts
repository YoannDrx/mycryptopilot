/**
 * Copy Trade Closure Tests
 *
 * Tests the automatic propagation of CLOSED status from TraderTrade to CopyTrade:
 * - closeOriginalTradeCopies() function
 * - PnL calculation for LONG and SHORT positions
 * - Manual vs AUTO mode handling
 * - Integration with fill-aggregation service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { closeOriginalTradeCopies } from "@/lib/trading/copy-trade.service";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    copyTrade: {
      findMany: vi.fn(),
      update: vi.fn(),
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

describe("CopyTradeClosure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("closeOriginalTradeCopies", () => {
    it("should close MANUAL LONG copy trade with correct PnL", async () => {
      const mockCopy = {
        id: "copy-1",
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100), // Bought at $100
        executedQuantity: new Decimal(1.5), // 1.5 BTC
        notes: "Initial copy",
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
        id: "copy-1",
      } as never);

      const exitPrice = 110;
      const count = await closeOriginalTradeCopies("trade-1", exitPrice);

      // Verify correct number of copies closed
      expect(count).toBe(1);

      // Verify update was called with correct PnL calculation
      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: "copy-1" });
      expect(updateCall.data.manualExit).toBe(110);

      // LONG position PnL: (exit - entry) * quantity = (110 - 100) * 1.5 = 15
      expect(updateCall.data.manualPnl).toBe(15);
      expect(updateCall.data.closedAt).toBeInstanceOf(Date);
      expect(updateCall.data.notes).toContain("Closed at $110.00");
      expect(updateCall.data.notes).toContain("PnL: +15.00 USDT");
    });

    it("should close MANUAL SHORT copy trade with correct PnL", async () => {
      const mockCopy = {
        id: "copy-2",
        userId: "user-2",
        originalTradeId: "trade-2",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100), // Sold at $100
        executedQuantity: new Decimal(2.0), // 2 BTC
        notes: "Short position",
        originalTrade: {
          side: "SELL", // SHORT
          averageEntry: new Decimal(100),
          averageExit: new Decimal(95),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-2",
      } as never);

      const exitPrice = 95;
      const count = await closeOriginalTradeCopies("trade-2", exitPrice);

      expect(count).toBe(1);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];
      expect(updateCall.data.manualExit).toBe(95);

      // SHORT position PnL: (entry - exit) * quantity = (100 - 95) * 2 = 10
      expect(updateCall.data.manualPnl).toBe(10);
      expect(updateCall.data.notes).toContain("PnL: +10.00 USDT");
    });

    it("should handle negative PnL for losing LONG trade", async () => {
      const mockCopy = {
        id: "copy-3",
        userId: "user-3",
        originalTradeId: "trade-3",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100),
        executedQuantity: new Decimal(1.0),
        notes: null,
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(100),
          averageExit: new Decimal(90),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-3",
      } as never);

      const exitPrice = 90;
      await closeOriginalTradeCopies("trade-3", exitPrice);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // LONG loss: (90 - 100) * 1 = -10
      expect(updateCall.data.manualPnl).toBe(-10);
      expect(updateCall.data.notes).toContain("PnL: -10.00 USDT");
    });

    it("should close AUTO copy trade using executedPrice", async () => {
      const mockCopy = {
        id: "copy-4",
        userId: "user-4",
        originalTradeId: "trade-4",
        mode: "AUTO",
        status: "EXECUTED",
        executedPrice: new Decimal(101), // Executed at $101 (slippage)
        executedQuantity: new Decimal(0.5),
        notes: "AUTO execution",
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
        id: "copy-4",
      } as never);

      const exitPrice = 110;
      await closeOriginalTradeCopies("trade-4", exitPrice);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // AUTO mode uses executedPrice (101) not manualEntry
      // PnL: (110 - 101) * 0.5 = 4.5
      expect(updateCall.data.manualPnl).toBe(4.5);
      expect(updateCall.data.manualExit).toBe(110);
    });

    it("should close multiple copy trades in parallel", async () => {
      const mockCopies = [
        {
          id: "copy-5",
          userId: "user-5",
          originalTradeId: "trade-5",
          mode: "MANUAL",
          status: "EXECUTED",
          manualEntry: new Decimal(100),
          executedQuantity: new Decimal(1.0),
          notes: "Copy 1",
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(100),
            averageExit: new Decimal(105),
          },
        },
        {
          id: "copy-6",
          userId: "user-6",
          originalTradeId: "trade-5",
          mode: "MANUAL",
          status: "EXECUTED",
          manualEntry: new Decimal(100),
          executedQuantity: new Decimal(2.0),
          notes: "Copy 2",
          originalTrade: {
            side: "BUY",
            averageEntry: new Decimal(100),
            averageExit: new Decimal(105),
          },
        },
      ];

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue(
        mockCopies as never,
      );
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({} as never);

      const exitPrice = 105;
      const count = await closeOriginalTradeCopies("trade-5", exitPrice);

      expect(count).toBe(2);
      expect(vi.mocked(prisma.copyTrade.update)).toHaveBeenCalledTimes(2);

      // Verify both copies got correct PnL
      const call1 = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];
      const call2 = vi.mocked(prisma.copyTrade.update).mock.calls[1][0];

      expect(call1.data.manualPnl).toBe(5); // (105-100)*1
      expect(call2.data.manualPnl).toBe(10); // (105-100)*2
    });

    it("should return 0 if no EXECUTED copies exist", async () => {
      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([]);

      const count = await closeOriginalTradeCopies("trade-6", 110);

      expect(count).toBe(0);
      expect(vi.mocked(prisma.copyTrade.update)).not.toHaveBeenCalled();
    });

    it("should preserve existing notes when adding closure info", async () => {
      const mockCopy = {
        id: "copy-7",
        userId: "user-7",
        originalTradeId: "trade-7",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100),
        executedQuantity: new Decimal(1.0),
        notes: "User's personal notes about this trade",
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
        id: "copy-7",
      } as never);

      await closeOriginalTradeCopies("trade-7", 110);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      expect(updateCall.data.notes).toContain("User's personal notes");
      expect(updateCall.data.notes).toContain("\n\n"); // Separator
      expect(updateCall.data.notes).toContain("Closed at $110.00");
    });

    it("should handle zero quantity gracefully", async () => {
      const mockCopy = {
        id: "copy-8",
        userId: "user-8",
        originalTradeId: "trade-8",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(100),
        executedQuantity: new Decimal(0), // Edge case
        notes: null,
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
        id: "copy-8",
      } as never);

      await closeOriginalTradeCopies("trade-8", 110);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // Zero quantity should result in zero PnL
      expect(updateCall.data.manualPnl).toBe(0);
    });
  });

  describe("Integration scenarios", () => {
    it("should calculate PnL correctly for DCA scenario", async () => {
      // User copied a DCA trade where trader bought at multiple prices
      // Trader average entry: $102 (bought 1@100 + 0.5@105)
      // User's manual entry: $102 (same DCA)
      const mockCopy = {
        id: "copy-9",
        userId: "user-9",
        originalTradeId: "trade-9",
        mode: "MANUAL",
        status: "EXECUTED",
        manualEntry: new Decimal(102), // DCA average
        executedQuantity: new Decimal(1.5),
        notes: "DCA copy",
        originalTrade: {
          side: "BUY",
          averageEntry: new Decimal(102),
          averageExit: new Decimal(110),
        },
      };

      vi.mocked(prisma.copyTrade.findMany).mockResolvedValue([
        mockCopy as never,
      ]);
      vi.mocked(prisma.copyTrade.update).mockResolvedValue({
        id: "copy-9",
      } as never);

      await closeOriginalTradeCopies("trade-9", 110);

      const updateCall = vi.mocked(prisma.copyTrade.update).mock.calls[0][0];

      // PnL: (110 - 102) * 1.5 = 12
      expect(updateCall.data.manualPnl).toBe(12);
    });
  });
});
