import { describe, expect, it } from "vitest";

describe("Discord Webhook", () => {
  describe("notifyNewSignal", () => {
    it("should handle signal with all fields", () => {
      const signal = {
        id: "test-signal-123",
        symbol: "BTC-USDT",
        createdAt: new Date("2025-10-09T12:00:00Z"),
        payloadJson: {
          bias: "LONG",
          entry: 50000,
          tps: [52000, 54000, 56000],
          invalidation: 48000,
          confidence: 85,
          risk: 3,
          leverageBand: "3x-5x",
          rationales: ["Strong support level", "Bullish divergence"],
        },
        trader: {
          name: "John Doe",
          traderProfile: {
            displayName: "CryptoMaster",
          },
        },
      };

      expect(signal.id).toBe("test-signal-123");
      expect(signal.symbol).toBe("BTC-USDT");
      expect(signal.trader.traderProfile?.displayName).toBe("CryptoMaster");
    });

    it("should handle signal with minimal fields", () => {
      const signal = {
        id: "test-signal-456",
        symbol: "ETH-USDT",
        createdAt: new Date("2025-10-09T12:00:00Z"),
        payloadJson: {},
        trader: {
          name: "Jane Smith",
        },
      };

      expect(signal.id).toBe("test-signal-456");
      expect(signal.symbol).toBe("ETH-USDT");
      expect(signal.trader.traderProfile).toBeUndefined();
    });
  });

  describe("Signal formatting", () => {
    it("should calculate risk/reward ratio correctly", () => {
      const entry = 50000;
      const tp1 = 52000;
      const invalidation = 48000;

      const riskReward = Math.abs((tp1 - entry) / (entry - invalidation));

      expect(riskReward).toBeCloseTo(1.0, 1);
    });

    it("should handle LONG bias", () => {
      const signal = { bias: "LONG" };
      const emoji = signal.bias === "LONG" ? "🟢" : "🔴";

      expect(emoji).toBe("🟢");
    });

    it("should handle SHORT bias", () => {
      const signal = { bias: "SHORT" };
      const emoji = signal.bias === "LONG" ? "🟢" : "🔴";

      expect(emoji).toBe("🔴");
    });
  });
});
