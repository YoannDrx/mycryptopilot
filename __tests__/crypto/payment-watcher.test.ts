import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CryptoNetwork } from "@/generated/prisma";

// Mock dependencies
vi.mock("@/lib/env", () => ({
  env: {
    BASE_RPC_URL: "https://mainnet.base.org",
    TRON_RPC_URL: "https://api.trongrid.io",
  },
}));

vi.mock("@/lib/subscription/subscription-manager", () => ({
  activateSubscription: vi.fn().mockResolvedValue({
    success: true,
    organizationId: "org_123",
    periodEnd: new Date(),
  }),
}));

vi.mock("@/lib/mail/resend", () => ({
  resendMailAdapter: vi.fn(),
}));

vi.mock("@/lib/discord/roles", () => ({
  assignRoleToUser: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cryptoPayment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cryptoAddress: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("ethers", () => ({
  JsonRpcProvider: vi.fn(),
  Contract: vi.fn(),
}));

vi.mock("tronweb", () => {
  return {
    default: vi.fn(),
  };
});

describe("payment-watcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAddressForPayments", () => {
    it("should return empty array when BASE_RPC_URL is not configured", async () => {
      const { env } = await import("@/lib/env");
      const originalBaseRpcUrl = env.BASE_RPC_URL;
      env.BASE_RPC_URL = undefined;

      const { checkAddressForPayments } = await import(
        "@/lib/crypto/payment-watcher"
      );

      const payments = await checkAddressForPayments(
        "0x123456789",
        "BASE" as CryptoNetwork,
      );

      expect(payments).toEqual([]);

      env.BASE_RPC_URL = originalBaseRpcUrl;
    });

    it("should return empty array when TRON_RPC_URL is not configured", async () => {
      const { env } = await import("@/lib/env");
      const originalTronRpcUrl = env.TRON_RPC_URL;
      env.TRON_RPC_URL = undefined;

      const { checkAddressForPayments } = await import(
        "@/lib/crypto/payment-watcher"
      );

      const payments = await checkAddressForPayments(
        "TXYZa1abc",
        "TRON" as CryptoNetwork,
      );

      expect(payments).toEqual([]);

      env.TRON_RPC_URL = originalTronRpcUrl;
    });

    it("should throw error for unsupported network", async () => {
      const { checkAddressForPayments } = await import(
        "@/lib/crypto/payment-watcher"
      );

      await expect(
        checkAddressForPayments("0x123", "ETHEREUM" as CryptoNetwork),
      ).rejects.toThrow("Unsupported network: ETHEREUM");
    });
  });

  describe("getPaymentStatus", () => {
    it("should return payment status when payment exists", async () => {
      const { prisma } = await import("@/lib/prisma");
      const mockPayment = {
        status: "CONFIRMED" as const,
        confirmations: 5,
      };

      vi.mocked(prisma.cryptoPayment.findUnique).mockResolvedValue(
        mockPayment as never,
      );

      const { getPaymentStatus } = await import("@/lib/crypto/payment-watcher");

      const result = await getPaymentStatus("0xabcdef");

      expect(result).toEqual({
        status: "CONFIRMED",
        confirmations: 5,
      });
      expect(prisma.cryptoPayment.findUnique).toHaveBeenCalledWith({
        where: { txHash: "0xabcdef" },
        select: {
          status: true,
          confirmations: true,
        },
      });
    });

    it("should return null when payment does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.cryptoPayment.findUnique).mockResolvedValue(null);

      const { getPaymentStatus } = await import("@/lib/crypto/payment-watcher");

      const result = await getPaymentStatus("0xnonexistent");

      expect(result).toBeNull();
    });
  });

  describe("processPayment", () => {
    it("should create new payment when it does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");

      // Mock no existing payment
      vi.mocked(prisma.cryptoPayment.findUnique).mockResolvedValue(null);

      // Mock crypto address lookup
      vi.mocked(prisma.cryptoAddress.findFirst).mockResolvedValue({
        id: "addr_123",
        userId: "user_123",
        network: "BASE",
        address: "0x123",
        derivationIndex: 0,
        isActive: true,
        createdAt: new Date(),
      } as never);

      // Mock payment creation
      vi.mocked(prisma.cryptoPayment.create).mockResolvedValue({
        id: "payment_123",
      } as never);

      const { processPayment } = await import("@/lib/crypto/payment-watcher");
      const { activateSubscription } = await import(
        "@/lib/subscription/subscription-manager"
      );

      const mockPayment = {
        txHash: "0xabc123",
        network: "BASE" as CryptoNetwork,
        address: "0x123",
        amountToken: 49,
        amountUSD: 49,
        currency: "USDC",
        confirmations: 2,
        timestamp: new Date(),
      };

      await processPayment(mockPayment, "user_123");

      expect(prisma.cryptoPayment.create).toHaveBeenCalled();
      expect(activateSubscription).toHaveBeenCalledWith({
        userId: "user_123",
        plan: "pro",
        daysGranted: 30,
      });
    });

    it("should update existing payment confirmations", async () => {
      const { prisma } = await import("@/lib/prisma");

      // Mock existing payment
      vi.mocked(prisma.cryptoPayment.findUnique).mockResolvedValue({
        id: "payment_123",
        txHash: "0xabc123",
        status: "PENDING",
        confirmations: 0,
      } as never);

      // Mock payment update
      vi.mocked(prisma.cryptoPayment.update).mockResolvedValue({
        id: "payment_123",
      } as never);

      const { processPayment } = await import("@/lib/crypto/payment-watcher");
      const { activateSubscription } = await import(
        "@/lib/subscription/subscription-manager"
      );

      const mockPayment = {
        txHash: "0xabc123",
        network: "BASE" as CryptoNetwork,
        address: "0x123",
        amountToken: 49,
        amountUSD: 49,
        currency: "USDC",
        confirmations: 2,
        timestamp: new Date(),
      };

      await processPayment(mockPayment, "user_123");

      expect(prisma.cryptoPayment.update).toHaveBeenCalledWith({
        where: { id: "payment_123" },
        data: {
          confirmations: 2,
          status: "CONFIRMED",
          confirmedAt: expect.any(Date),
        },
      });
      expect(activateSubscription).toHaveBeenCalledWith({
        userId: "user_123",
        plan: "pro",
        daysGranted: 30,
      });
    });
  });

  describe("retryPayment", () => {
    it("should throw error when payment not found", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.cryptoPayment.findUnique).mockResolvedValue(null);

      const { retryPayment } = await import("@/lib/crypto/payment-watcher");

      await expect(retryPayment("nonexistent_id")).rejects.toThrow(
        "Payment nonexistent_id not found",
      );
    });
  });
});
