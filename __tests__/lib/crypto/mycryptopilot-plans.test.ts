import { describe, it, expect } from "vitest";
import {
  calculateDaysGranted,
  getPlanFromAmount,
  canPerformAction,
} from "@/lib/crypto/mycryptopilot-plans";

describe("mycryptopilot plans helpers", () => {
  it("calculates days granted with pro-rata logic", () => {
    expect(calculateDaysGranted(49, "pro")).toBe(30);
    expect(calculateDaysGranted(24.5, "pro")).toBe(15);
    expect(calculateDaysGranted(0, "pro")).toBe(0);
    expect(calculateDaysGranted(1, "test")).toBe(0);
  });

  it("detects plan from amount with tolerance", () => {
    expect(getPlanFromAmount(1)).toBe("test");
    expect(getPlanFromAmount(49)).toBe("pro");
    expect(getPlanFromAmount(99)).toBe("ultra");
    // Unknown amount defaults to pro
    expect(getPlanFromAmount(12)).toBe("pro");
  });

  it("checks feature availability for limits", () => {
    expect(canPerformAction("free", "riskConsole")).toBe(true);
    expect(canPerformAction("pro", "riskConsole")).toBe(true);
    expect(canPerformAction("ultra", "tradersFollow")).toBe(true);
  });
});
