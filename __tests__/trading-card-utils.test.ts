import {
  calculatePositionSize,
  suggestLeverage,
  validateTradingCard,
  type TradingCardPayloadType,
} from "@/features/signal/trading-card-utils";
import { describe, expect, it } from "vitest";

describe("trading-card-utils", () => {
  describe("calculatePositionSize", () => {
    it("should calculate correct position size for a LONG trade", () => {
      const result = calculatePositionSize({
        accountSize: 10000,
        riskPercentage: 2,
        entryPrice: 50000,
        invalidationPrice: 48000,
        bias: "LONG",
      });

      // Risk amount: 2% of 10000 = 200 USD
      expect(result.riskAmount).toBe(200);

      // Risk distance: (50000 - 48000) / 50000 = 4%
      expect(result.riskPercentageDistance).toBe(4);

      // Position size: 200 / 0.04 = 5000 USD
      expect(result.positionSizeUSD).toBe(5000);

      // Position units: 5000 / 50000 = 0.1 BTC
      expect(result.positionSizeUnits).toBe(0.1);

      // Collateral: 5000 / 1 (no leverage) = 5000
      expect(result.collateralRequired).toBe(5000);

      // Stop loss: 200 USD
      expect(result.stopLossUSD).toBe(200);
    });

    it("should calculate correct position size for a SHORT trade", () => {
      const result = calculatePositionSize({
        accountSize: 10000,
        riskPercentage: 1,
        entryPrice: 50000,
        invalidationPrice: 52000,
        bias: "SHORT",
      });

      // Risk amount: 1% of 10000 = 100 USD
      expect(result.riskAmount).toBe(100);

      // Risk distance: (52000 - 50000) / 50000 = 4%
      expect(result.riskPercentageDistance).toBe(4);

      // Position size: 100 / 0.04 = 2500 USD
      expect(result.positionSizeUSD).toBe(2500);

      // Position units: 2500 / 50000 = 0.05 BTC
      expect(result.positionSizeUnits).toBe(0.05);
    });

    it("should apply leverage to collateral calculation", () => {
      const result = calculatePositionSize({
        accountSize: 10000,
        riskPercentage: 2,
        entryPrice: 50000,
        invalidationPrice: 48000,
        bias: "LONG",
        leverage: 5,
      });

      // Position size: 5000 USD
      expect(result.positionSizeUSD).toBe(5000);

      // Collateral with 5x leverage: 5000 / 5 = 1000 USD
      expect(result.collateralRequired).toBe(1000);
    });

    it("should throw error for invalid account size", () => {
      expect(() =>
        calculatePositionSize({
          accountSize: -100,
          riskPercentage: 2,
          entryPrice: 50000,
          invalidationPrice: 48000,
          bias: "LONG",
        }),
      ).toThrow("Account size must be positive");
    });

    it("should throw error for invalid risk percentage", () => {
      expect(() =>
        calculatePositionSize({
          accountSize: 10000,
          riskPercentage: 0,
          entryPrice: 50000,
          invalidationPrice: 48000,
          bias: "LONG",
        }),
      ).toThrow("Risk percentage must be between 0 and 100");
    });

    it("should throw error for LONG with invalid stop loss", () => {
      expect(() =>
        calculatePositionSize({
          accountSize: 10000,
          riskPercentage: 2,
          entryPrice: 50000,
          invalidationPrice: 52000, // Above entry for LONG
          bias: "LONG",
        }),
      ).toThrow("For LONG trades, invalidation must be below entry price");
    });

    it("should throw error for SHORT with invalid stop loss", () => {
      expect(() =>
        calculatePositionSize({
          accountSize: 10000,
          riskPercentage: 2,
          entryPrice: 50000,
          invalidationPrice: 48000, // Below entry for SHORT
          bias: "SHORT",
        }),
      ).toThrow("For SHORT trades, invalidation must be above entry price");
    });
  });

  describe("suggestLeverage", () => {
    it("should suggest high leverage for BTC with low risk", () => {
      const result = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      expect(result.minLeverage).toBe(1);
      expect(result.maxLeverage).toBeGreaterThan(5);
      expect(result.optimalLeverage).toBeGreaterThan(1);
      // Risk level is MEDIUM or LOW depending on optimal leverage
      expect(["LOW", "MEDIUM"]).toContain(result.riskLevel);
      expect(result.reason).toContain("BTC");
      expect(result.reason).toContain("low risk");
    });

    it("should suggest lower leverage for high risk trades", () => {
      const lowRiskResult = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      const highRiskResult = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 5,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      expect(highRiskResult.maxLeverage).toBeLessThan(
        lowRiskResult.maxLeverage,
      );
      expect(highRiskResult.optimalLeverage).toBeLessThan(
        lowRiskResult.optimalLeverage,
      );
      expect(highRiskResult.riskLevel).not.toBe("LOW");
    });

    it("should suggest lower leverage for tight stops", () => {
      const wideStopResult = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      const tightStopResult = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 1.5, // Tight stop
      });

      expect(tightStopResult.maxLeverage).toBeLessThan(
        wideStopResult.maxLeverage,
      );
    });

    it("should suggest lower leverage for low liquidity tokens", () => {
      const btcResult = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      const lowLiqResult = suggestLeverage({
        symbol: "SHIB-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      expect(lowLiqResult.maxLeverage).toBeLessThan(btcResult.maxLeverage);
    });

    it("should return 1x leverage for SPOT trades", () => {
      const result = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "SPOT",
        riskDistancePercentage: 5,
      });

      expect(result.minLeverage).toBe(1);
      expect(result.maxLeverage).toBe(1);
      expect(result.optimalLeverage).toBe(1);
      expect(result.reason).toContain("SPOT");
    });

    it("should differentiate medium liquidity tokens", () => {
      const solResult = suggestLeverage({
        symbol: "SOL-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      const btcResult = suggestLeverage({
        symbol: "BTC-USDT",
        cardRiskLevel: 2,
        instrumentType: "PERP",
        riskDistancePercentage: 5,
      });

      expect(solResult.maxLeverage).toBeLessThan(btcResult.maxLeverage);
      expect(solResult.maxLeverage).toBeGreaterThan(3); // Better than low liq
    });
  });

  describe("validateTradingCard", () => {
    const validLongCard: TradingCardPayloadType = {
      instrumentType: "PERP",
      bias: "LONG",
      entry: 50000,
      invalidation: 48000,
      tps: [52000, 54000, 56000],
      leverageBand: "1-5x",
      risk: 3,
      confidence: 75,
      rationales: ["Strong support at 48k", "Bullish divergence"],
      regime: "Bull",
      managedBy: "HUMAN",
      version: "1.0",
    };

    const validShortCard: TradingCardPayloadType = {
      instrumentType: "PERP",
      bias: "SHORT",
      entry: 50000,
      invalidation: 52000,
      tps: [48000, 46000, 44000],
      leverageBand: "1-3x",
      risk: 2,
      confidence: 80,
      rationales: ["Resistance at 52k", "Bearish engulfing"],
      regime: "Bear",
      managedBy: "AI",
      version: "1.0",
    };

    it("should validate a correct LONG card", () => {
      const result = validateTradingCard(validLongCard);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.riskPercentage).toBeCloseTo(4, 1);
      expect(result.metrics.riskRewardRatio).toBeGreaterThan(1);
    });

    it("should validate a correct SHORT card", () => {
      const result = validateTradingCard(validShortCard);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.riskPercentage).toBeCloseTo(4, 1);
      expect(result.metrics.riskRewardRatio).toBeGreaterThan(1);
    });

    it("should reject LONG card with invalidation above entry", () => {
      const invalidCard: TradingCardPayloadType = {
        ...validLongCard,
        invalidation: 52000, // Above entry
      };

      const result = validateTradingCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("invalidation");
      expect(result.errors[0]).toContain("below entry");
    });

    it("should reject SHORT card with invalidation below entry", () => {
      const invalidCard: TradingCardPayloadType = {
        ...validShortCard,
        invalidation: 48000, // Below entry
      };

      const result = validateTradingCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("invalidation");
      expect(result.errors[0]).toContain("above entry");
    });

    it("should reject LONG card with TPs below entry", () => {
      const invalidCard: TradingCardPayloadType = {
        ...validLongCard,
        tps: [48000, 46000], // Below entry
      };

      const result = validateTradingCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("TP");
      expect(result.errors[0]).toContain("above entry");
    });

    it("should reject SHORT card with TPs above entry", () => {
      const invalidCard: TradingCardPayloadType = {
        ...validShortCard,
        tps: [52000, 54000], // Above entry
      };

      const result = validateTradingCard(invalidCard);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("TP");
      expect(result.errors[0]).toContain("below entry");
    });

    it("should warn about low risk/reward ratio", () => {
      const lowRRCard: TradingCardPayloadType = {
        ...validLongCard,
        entry: 50000,
        invalidation: 49000, // 2% risk
        tps: [50500], // 1% reward -> RR = 0.5
      };

      const result = validateTradingCard(lowRRCard);

      expect(result.isValid).toBe(true); // Valid but with warning
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("risk/reward");
      expect(result.metrics.riskRewardRatio).toBeLessThan(1.5);
    });

    it("should warn about high risk distance", () => {
      const highRiskCard: TradingCardPayloadType = {
        ...validLongCard,
        entry: 50000,
        invalidation: 44000, // 12% risk
        tps: [56000],
      };

      const result = validateTradingCard(highRiskCard);

      expect(result.isValid).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("High risk distance")),
      ).toBe(true);
      expect(result.metrics.riskPercentage).toBeGreaterThan(10);
    });

    it("should warn about very tight stop", () => {
      const tightStopCard: TradingCardPayloadType = {
        ...validLongCard,
        entry: 50000,
        invalidation: 49600, // 0.8% risk
        tps: [52000],
      };

      const result = validateTradingCard(tightStopCard);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("tight stop"))).toBe(true);
      expect(result.metrics.riskPercentage).toBeLessThan(1);
    });

    it("should calculate correct metrics", () => {
      const result = validateTradingCard(validLongCard);

      // Entry: 50000, Invalidation: 48000
      // Risk: 2000 / 50000 = 4%
      expect(result.metrics.riskPercentage).toBeCloseTo(4, 1);

      // TPs: [52000, 54000, 56000]
      // Rewards: [2000, 4000, 6000]
      // Avg: 4000
      // Avg %: 4000 / 50000 = 8%
      expect(result.metrics.averageTPPercentage).toBeCloseTo(8, 1);

      // Nearest TP: 52000
      // Distance: 2000
      // %: 2000 / 50000 = 4%
      expect(result.metrics.nearestTPPercentage).toBeCloseTo(4, 1);

      // Risk/Reward: 4000 / 2000 = 2
      expect(result.metrics.riskRewardRatio).toBeCloseTo(2, 1);
    });
  });
});
