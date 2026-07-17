import { describe, expect, it } from "vitest";

import {
  FinancialExecutionDisabledError,
  isMyCryptoPilotFeatureActive,
  isMyCryptoPilotPathEnabled,
  rejectFinancialExecution,
} from "@/config/product-features";
import { ConnectExchangeSchema } from "@/features/exchange/exchange.schema";
import {
  createExchangeService,
  ExchangeMutationDisabledError,
} from "@/lib/exchange/exchange-service-factory";

describe("MyCryptoPilot feature manifest", () => {
  it("keeps the demonstrator read-only", () => {
    expect(isMyCryptoPilotPathEnabled("/risk-console")).toBe(true);
    expect(isMyCryptoPilotPathEnabled("/portfolio")).toBe(true);
    expect(isMyCryptoPilotPathEnabled("/my-trades")).toBe(false);
    expect(isMyCryptoPilotPathEnabled("/school/courses")).toBe(false);
    expect(isMyCryptoPilotPathEnabled("/checkout/pro")).toBe(false);
    expect(isMyCryptoPilotPathEnabled("/dashboard")).toBe(false);
    expect(isMyCryptoPilotPathEnabled("/account/payments")).toBe(false);
    expect(isMyCryptoPilotPathEnabled("/payment/success")).toBe(false);
    expect(isMyCryptoPilotPathEnabled("/account/exchanges")).toBe(true);
    expect(isMyCryptoPilotFeatureActive("copyTrading")).toBe(false);
  });

  it("only accepts exchanges with verified read-only scope inspection", () => {
    expect(
      ConnectExchangeSchema.safeParse({
        exchange: "BINANCE",
        apiKey: "demo-key",
        secretKey: "demo-secret",
      }).success,
    ).toBe(true);
    expect(
      ConnectExchangeSchema.safeParse({
        exchange: "BITGET",
        apiKey: "demo-key",
        secretKey: "demo-secret",
        passphrase: "demo-passphrase",
      }).success,
    ).toBe(false);
  });

  it("blocks exchange mutations at the shared adapter boundary", async () => {
    const service = createExchangeService("BINANCE", "demo-key", "demo-secret");

    await expect(
      service.createOrder({
        symbol: "BTCUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.001,
        instrumentType: "SPOT",
      }),
    ).rejects.toBeInstanceOf(ExchangeMutationDisabledError);

    await service.close();
  });

  it("keeps financial execution disabled independently from navigation flags", () => {
    expect(() => rejectFinancialExecution("test order")).toThrow(
      FinancialExecutionDisabledError,
    );
  });
});
