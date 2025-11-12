import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCopyTrade } from "@/lib/trading/copy-trade.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    copyTrade: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    traderTrade: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("createCopyTrade validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid copy ratios", async () => {
    await expect(
      createCopyTrade({
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "AUTO",
        copyRatio: 2,
      }),
    ).rejects.toThrow("Copy ratio must be between 0.01 and 1.0");
  });

  it("rejects manual mode without manualEntry", async () => {
    await expect(
      createCopyTrade({
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "MANUAL",
      }),
    ).rejects.toThrow("Manual entry price is required for MANUAL mode");
  });

  it("prevents duplicate copy trades per user", async () => {
    vi.mocked(prisma.copyTrade.findFirst).mockResolvedValue({
      id: "copy-1",
    } as never);

    await expect(
      createCopyTrade({
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "AUTO",
        copyRatio: 0.5,
      }),
    ).rejects.toThrow("You already have an active copy of this trade");
  });

  it("requires original trade to be open", async () => {
    vi.mocked(prisma.copyTrade.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.traderTrade.findUnique).mockResolvedValue({
      id: "trade-1",
      status: "CLOSED",
    } as never);

    await expect(
      createCopyTrade({
        userId: "user-1",
        originalTradeId: "trade-1",
        mode: "AUTO",
      }),
    ).rejects.toThrow("Can only copy open trades");
  });
});
