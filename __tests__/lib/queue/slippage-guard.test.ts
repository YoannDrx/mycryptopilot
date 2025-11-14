import { describe, it, expect } from "vitest";
import {
  assertSlippageWithinThreshold,
  getSlippageThreshold,
  SlippageExceededError,
} from "@/lib/queue/slippage-guard";

describe("Slippage Guard", () => {
  it("uses different thresholds for spot vs futures", () => {
    expect(getSlippageThreshold("SPOT")).toBeGreaterThan(0);
    expect(getSlippageThreshold("FUTURES_USDT")).toBeGreaterThan(
      getSlippageThreshold("SPOT"),
    );
  });

  it("passes when slippage is within threshold", () => {
    expect(() => assertSlippageWithinThreshold(0.5, "SPOT")).not.toThrow();
  });

  it("throws SlippageExceededError when threshold exceeded", () => {
    expect(() => assertSlippageWithinThreshold(5, "SPOT")).toThrow(
      SlippageExceededError,
    );
  });

  it("handles negative slippage (better fills) without errors", () => {
    expect(() => assertSlippageWithinThreshold(-0.8, "SPOT")).not.toThrow();
  });
});
