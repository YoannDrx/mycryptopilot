import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    signal: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    traderProfile: {
      findMany: vi.fn(),
    },
  },
}));

describe("signal-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSignalsFeed", () => {
    it("should return signals with default pagination", async () => {
      const { prisma } = await import("@/lib/prisma");

      const mockSignals = [
        {
          id: "signal_1",
          symbol: "BTC-USDT",
          status: "ACTIVE",
          createdAt: new Date("2025-10-12T10:00:00Z"),
          expiresAt: new Date("2025-10-13T10:00:00Z"),
          payloadJson: {
            bias: "LONG",
            entry: 50000,
            tps: [52000],
            invalidation: 48000,
          },
          trader: {
            id: "trader_1",
            name: "John Doe",
            traderProfile: {
              displayName: "Pro Trader",
              verified: true,
            },
          },
        },
      ];

      vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals as never);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      const result = await getSignalsFeed({ limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeUndefined();
      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 21, // limit + 1 for hasNextPage detection
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("should filter by single symbol", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ symbol: "BTC-USDT", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.symbol).toBe("BTC-USDT");
      expect(call[0].where.expiresAt).toEqual({ gt: expect.any(Date) });
    });

    it("should filter by multiple symbols", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ symbols: ["BTC-USDT", "ETH-USDT"], limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.symbol).toEqual({
        in: ["BTC-USDT", "ETH-USDT"],
      });
    });

    it("should filter by bias (LONG)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ bias: "LONG", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.AND).toEqual([
        { payloadJson: { path: ["bias"], equals: "LONG" } },
      ]);
    });

    it("should filter by bias (SHORT)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ bias: "SHORT", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.AND).toEqual([
        { payloadJson: { path: ["bias"], equals: "SHORT" } },
      ]);
    });

    it("should filter by status (ACTIVE)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ status: "ACTIVE", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.expiresAt).toEqual({ gt: expect.any(Date) });
    });

    it("should filter by status (EXPIRED)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ status: "EXPIRED", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.expiresAt).toEqual({ lte: expect.any(Date) });
    });

    it("should filter by instrumentType (SPOT)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ instrumentType: "SPOT", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.AND).toEqual([
        { payloadJson: { path: ["instrumentType"], equals: "SPOT" } },
      ]);
    });

    it("should filter by instrumentType (PERP)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ instrumentType: "PERP", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.AND).toEqual([
        { payloadJson: { path: ["instrumentType"], equals: "PERP" } },
      ]);
    });

    it("should filter by trader name", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ traderName: "Pro Trader", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.trader.traderProfile.displayName).toEqual({
        contains: "Pro Trader",
        mode: "insensitive",
      });
    });

    it("should filter by verifiedOnly", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ verifiedOnly: true, limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            trader: {
              traderProfile: {
                verified: true,
              },
            },
          }),
        }),
      );
    });

    it("should filter by traderId", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ traderId: "user_123", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            traderId: "user_123",
          }),
        }),
      );
    });

    it("should filter by date range (createdAfter only)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      const afterDate = new Date("2025-10-01T00:00:00Z");

      await getSignalsFeed({ createdAfter: afterDate, limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: afterDate },
          }),
        }),
      );
    });

    it("should filter by date range (createdBefore only)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      const beforeDate = new Date("2025-10-31T23:59:59Z");

      await getSignalsFeed({ createdBefore: beforeDate, limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { lte: beforeDate },
          }),
        }),
      );
    });

    it("should filter by date range (both createdAfter and createdBefore)", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      const afterDate = new Date("2025-10-01T00:00:00Z");
      const beforeDate = new Date("2025-10-31T23:59:59Z");

      await getSignalsFeed({
        createdAfter: afterDate,
        createdBefore: beforeDate,
        limit: 20,
      });

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: afterDate, lte: beforeDate },
          }),
        }),
      );
    });

    it("should handle cursor-based pagination", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({ cursor: "signal_cursor_123", limit: 20 });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].cursor).toEqual({ id: "signal_cursor_123" });
      expect(call[0].skip).toBe(1);
    });

    it("should detect hasNextPage correctly when more items exist", async () => {
      const { prisma } = await import("@/lib/prisma");

      // Return limit + 1 items
      const mockSignals = Array.from({ length: 21 }, (_, i) => ({
        id: `signal_${i + 1}`,
        symbol: "BTC-USDT",
        status: "ACTIVE",
        createdAt: new Date(`2025-10-${12 - i}T10:00:00Z`),
        payloadJson: {},
        trader: {
          id: "trader_1",
          name: "John Doe",
          traderProfile: null,
        },
      }));

      vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals as never);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      const result = await getSignalsFeed({ limit: 20 });

      expect(result.items).toHaveLength(20); // Only return limit items
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe("signal_20"); // Last item's ID
    });

    it("should not have nextPage when fewer items than limit", async () => {
      const { prisma } = await import("@/lib/prisma");

      // Return fewer items than limit
      const mockSignals = Array.from({ length: 10 }, (_, i) => ({
        id: `signal_${i + 1}`,
        symbol: "BTC-USDT",
        status: "ACTIVE",
        createdAt: new Date(`2025-10-${12 - i}T10:00:00Z`),
        payloadJson: {},
        trader: {
          id: "trader_1",
          name: "John Doe",
          traderProfile: null,
        },
      }));

      vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals as never);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      const result = await getSignalsFeed({ limit: 20 });

      expect(result.items).toHaveLength(10);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should combine multiple filters correctly", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const { getSignalsFeed } = await import(
        "@/features/signal/signal-queries"
      );

      await getSignalsFeed({
        symbols: ["BTC-USDT", "ETH-USDT"],
        bias: "LONG",
        status: "ACTIVE",
        instrumentType: "PERP",
        verifiedOnly: true,
        limit: 20,
      });

      expect(prisma.signal.findMany).toHaveBeenCalled();
      const call = vi.mocked(prisma.signal.findMany).mock.calls[0];
      expect(call[0].where.symbol).toEqual({
        in: ["BTC-USDT", "ETH-USDT"],
      });
      expect(call[0].where.AND).toEqual([
        { payloadJson: { path: ["bias"], equals: "LONG" } },
        { payloadJson: { path: ["instrumentType"], equals: "PERP" } },
      ]);
      expect(call[0].where.trader.traderProfile.verified).toBe(true);
    });
  });

  describe("SignalFiltersSchema", () => {
    it("should validate valid filters", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const validFilters = {
        symbols: ["BTC-USDT", "ETH-USDT"],
        bias: "LONG",
        status: "ACTIVE",
        instrumentType: "PERP",
        verifiedOnly: true,
        limit: 20,
      };

      const result = SignalFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it("should reject invalid bias", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const invalidFilters = {
        bias: "INVALID",
      };

      const result = SignalFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const invalidFilters = {
        status: "INVALID",
      };

      const result = SignalFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it("should reject invalid instrumentType", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const invalidFilters = {
        instrumentType: "INVALID",
      };

      const result = SignalFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it("should reject limit < 1", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const invalidFilters = {
        limit: 0,
      };

      const result = SignalFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const invalidFilters = {
        limit: 101,
      };

      const result = SignalFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it("should use default limit of 20", async () => {
      const { SignalFiltersSchema } = await import(
        "@/features/signal/signal.schema"
      );

      const filters = {};

      const result = SignalFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });
  });
});
