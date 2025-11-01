/**
 * Genesis Trade Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  createGenesisTrade,
  getGenesisTrade,
  hasGenesisTrade,
  deleteGenesisTrade,
  calculateTotalRealizedPnl,
  type GenesisTradeInput,
} from "@/lib/trading/genesis-trade.service";
import { prisma } from "@/lib/prisma";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    traderProfile: {
      findUnique: vi.fn(),
    },
    traderTrade: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("GenesisTradeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGenesisTrade", () => {
    const mockTraderProfile = {
      id: "trader-123",
      userId: "user-123",
      displayName: "Test Trader",
      bio: null,
      statsJson: {},
      verified: false,
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validInput: GenesisTradeInput = {
      traderProfileId: "trader-123",
      totalValue: 10000,
      date: new Date("2024-01-01"),
      notes: "Initial portfolio",
    };

    it("should create genesis trade successfully", async () => {
      const mockGenesisTrade = {
        id: "genesis-1",
        traderProfileId: "trader-123",
        source: "MANUAL" as const,
        instrumentType: "SPOT" as const,
        symbol: "GENESIS/USD",
        status: "CLOSED" as const,
        side: "BUY" as const,
        totalQuantity: new Decimal(0),
        averageEntry: new Decimal(0),
        averageExit: new Decimal(0),
        realizedPnl: new Decimal(10000),
        fees: new Decimal(0),
        stopLoss: null,
        takeProfit: null,
        openedAt: new Date("2024-01-01"),
        closedAt: new Date("2024-01-01"),
        lastActivityAt: new Date("2024-01-01"),
        notes: "Initial portfolio",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.traderProfile.findUnique).mockResolvedValue(
        mockTraderProfile as never,
      );
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null); // No existing genesis
      vi.mocked(prisma.traderTrade.create).mockResolvedValue(
        mockGenesisTrade as never,
      );

      const result = await createGenesisTrade(validInput);

      expect(result).toEqual(mockGenesisTrade);
      expect(prisma.traderProfile.findUnique).toHaveBeenCalledWith({
        where: { id: "trader-123" },
        select: { id: true, displayName: true },
      });
      expect(prisma.traderTrade.findFirst).toHaveBeenCalledWith({
        where: {
          traderProfileId: "trader-123",
          symbol: "GENESIS/USD",
        },
      });
      expect(prisma.traderTrade.create).toHaveBeenCalled();
    });

    it("should throw error if traderProfileId is missing", async () => {
      const invalidInput = {
        ...validInput,
        traderProfileId: "",
      };

      await expect(createGenesisTrade(invalidInput)).rejects.toThrow(
        "traderProfileId is required",
      );
    });

    it("should throw error if totalValue is negative", async () => {
      const invalidInput = {
        ...validInput,
        totalValue: -1000,
      };

      await expect(createGenesisTrade(invalidInput)).rejects.toThrow(
        "totalValue cannot be negative",
      );
    });

    it("should throw error if trader profile not found", async () => {
      vi.mocked(prisma.traderProfile.findUnique).mockResolvedValue(null);

      await expect(createGenesisTrade(validInput)).rejects.toThrow(
        "Trader profile not found",
      );
    });

    it("should throw error if genesis trade already exists", async () => {
      const existingGenesis = {
        id: "existing-genesis",
        symbol: "GENESIS/USD",
      };

      vi.mocked(prisma.traderProfile.findUnique).mockResolvedValue(
        mockTraderProfile as never,
      );
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(
        existingGenesis as never,
      );

      await expect(createGenesisTrade(validInput)).rejects.toThrow(
        "Genesis trade already exists",
      );
    });

    it("should use custom symbol if provided", async () => {
      const customInput = {
        ...validInput,
        symbol: "CUSTOM/USD",
      };

      const mockGenesisTrade = {
        id: "genesis-1",
        symbol: "CUSTOM/USD",
      };

      vi.mocked(prisma.traderProfile.findUnique).mockResolvedValue(
        mockTraderProfile as never,
      );
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.traderTrade.create).mockResolvedValue(
        mockGenesisTrade as never,
      );

      await createGenesisTrade(customInput);

      expect(prisma.traderTrade.findFirst).toHaveBeenCalledWith({
        where: {
          traderProfileId: "trader-123",
          symbol: "CUSTOM/USD",
        },
      });
    });
  });

  describe("getGenesisTrade", () => {
    it("should return genesis trade if found", async () => {
      const mockGenesis = {
        id: "genesis-1",
        symbol: "GENESIS/USD",
        traderProfileId: "trader-123",
      };

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(
        mockGenesis as never,
      );

      const result = await getGenesisTrade("trader-123");

      expect(result).toEqual(mockGenesis);
      expect(prisma.traderTrade.findFirst).toHaveBeenCalledWith({
        where: {
          traderProfileId: "trader-123",
          symbol: "GENESIS/USD",
        },
      });
    });

    it("should return null if not found", async () => {
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);

      const result = await getGenesisTrade("trader-123");

      expect(result).toBeNull();
    });
  });

  describe("hasGenesisTrade", () => {
    it("should return true if genesis trade exists", async () => {
      vi.mocked(prisma.traderTrade.count).mockResolvedValue(1);

      const result = await hasGenesisTrade("trader-123");

      expect(result).toBe(true);
      expect(prisma.traderTrade.count).toHaveBeenCalledWith({
        where: {
          traderProfileId: "trader-123",
          symbol: "GENESIS/USD",
        },
      });
    });

    it("should return false if genesis trade does not exist", async () => {
      vi.mocked(prisma.traderTrade.count).mockResolvedValue(0);

      const result = await hasGenesisTrade("trader-123");

      expect(result).toBe(false);
    });
  });

  describe("deleteGenesisTrade", () => {
    it("should delete genesis trade if found", async () => {
      const mockGenesis = {
        id: "genesis-1",
        symbol: "GENESIS/USD",
      };

      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(
        mockGenesis as never,
      );
      vi.mocked(prisma.traderTrade.delete).mockResolvedValue(
        mockGenesis as never,
      );

      const result = await deleteGenesisTrade("trader-123");

      expect(result).toEqual(mockGenesis);
      expect(prisma.traderTrade.delete).toHaveBeenCalledWith({
        where: { id: "genesis-1" },
      });
    });

    it("should return null if genesis trade not found", async () => {
      vi.mocked(prisma.traderTrade.findFirst).mockResolvedValue(null);

      const result = await deleteGenesisTrade("trader-123");

      expect(result).toBeNull();
      expect(prisma.traderTrade.delete).not.toHaveBeenCalled();
    });
  });

  describe("calculateTotalRealizedPnl", () => {
    it("should calculate total realized PnL including genesis", async () => {
      const mockTrades = [
        { realizedPnl: new Decimal(10000) }, // Genesis
        { realizedPnl: new Decimal(500) }, // Trade 1
        { realizedPnl: new Decimal(-200) }, // Trade 2 (loss)
        { realizedPnl: new Decimal(300) }, // Trade 3
      ];

      vi.mocked(prisma.traderTrade.findMany).mockResolvedValue(
        mockTrades as never,
      );

      const result = await calculateTotalRealizedPnl("trader-123");

      // 10000 + 500 - 200 + 300 = 10600
      expect(result).toBe(10600);
      expect(prisma.traderTrade.findMany).toHaveBeenCalledWith({
        where: {
          traderProfileId: "trader-123",
          status: "CLOSED",
        },
        select: {
          realizedPnl: true,
        },
      });
    });

    it("should return 0 if no closed trades", async () => {
      vi.mocked(prisma.traderTrade.findMany).mockResolvedValue([]);

      const result = await calculateTotalRealizedPnl("trader-123");

      expect(result).toBe(0);
    });

    it("should handle null realizedPnl values", async () => {
      const mockTrades = [
        { realizedPnl: new Decimal(1000) },
        { realizedPnl: null }, // Should be treated as 0
        { realizedPnl: new Decimal(500) },
      ];

      vi.mocked(prisma.traderTrade.findMany).mockResolvedValue(
        mockTrades as never,
      );

      const result = await calculateTotalRealizedPnl("trader-123");

      // 1000 + 0 + 500 = 1500
      expect(result).toBe(1500);
    });
  });
});
