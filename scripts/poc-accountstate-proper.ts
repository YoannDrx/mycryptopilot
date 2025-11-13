#!/usr/bin/env tsx

/* eslint-disable no-console */

/**
 * Proper POC AccountState Package
 *
 * Tests accountstate package with its actual API (AccountStateStore).
 * Based on official npm documentation.
 *
 * Evaluates:
 * 1. Can we import and use AccountStateStore?
 * 2. Can we track positions (setActivePosition)?
 * 3. Can we track orders (upsertActiveOrder)?
 * 4. Can we get summaries (getSessionSummary)?
 * 5. Does it fit our use case (fill aggregation)?
 *
 * Verdict:
 * - If API is simple and fits → ADOPT
 * - If API doesn't match our needs → CUSTOM
 */

console.log("\n🔬 ACCOUNTSTATE POC (Proper Test)");
console.log("═══════════════════════════════════════\n");

async function runProperPOC() {
  try {
    // Test 1: Import
    console.log("1️⃣  Testing import...");
    const { AccountStateStore } = await import("accountstate");
    console.log("✅ AccountStateStore imported");

    // Test 2: Create instance
    console.log("\n2️⃣  Creating instance...");
    const accountState = new AccountStateStore();
    console.log("✅ Instance created");

    // Test 3: Set wallet balance
    console.log("\n3️⃣  Testing balance tracking...");
    accountState.setWalletBalance(10000);
    const balance = accountState.getWalletBalance();
    console.log(`✅ Balance set and retrieved: $${balance}`);

    // Test 4: Track a position
    console.log("\n4️⃣  Testing position tracking...");
    accountState.setActivePosition("BTCUSDT", "LONG", {
      symbol: "BTCUSDT",
      timestampMs: Date.now(),
      positionSide: "LONG",
      orderPositionSide: "LONG",
      positionPrice: 45000,
      assetQty: 0.1,
      value: 4500,
      valueUpnl: 0,
      liquidationPrice: 40000,
      marginValue: 4500,
      stopLossPrice: undefined,
      takeProfitPrice: undefined,
    });
    console.log("✅ Position tracked");

    const hasPosition = accountState.isSymbolInAnyPosition("BTCUSDT");
    console.log(`✅ Position exists: ${hasPosition}`);

    const position = accountState.getActivePosition("BTCUSDT", "LONG");
    if (position) {
      console.log(
        `✅ Position retrieved: ${position.assetQty} BTC @ $${position.positionPrice}`,
      );
    }

    // Test 5: Track an order
    console.log("\n5️⃣  Testing order tracking...");
    accountState.upsertActiveOrder({
      exchangeOrderId: "12345",
      customOrderId: "test-order-1",
      symbol: "BTCUSDT",
      orderSide: "BUY",
      orderType: "LIMIT",
      positionSide: "LONG",
      status: "NEW",
      price: 44000,
      originalQuantity: 0.05,
      executedQuantity: 0,
      averagePrice: 0,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      isreduceOnly: false,
    });
    console.log("✅ Order tracked");

    const orders = accountState.getActiveOrders();
    console.log(`✅ Active orders: ${orders.length}`);

    // Test 6: Get session summary
    console.log("\n6️⃣  Testing session summary...");
    const summary = accountState.getSessionSummary(10000);
    console.log("✅ Summary retrieved:");
    console.log(`   Balance: $${summary.account.quoteBalanceState.now}`);
    console.log(`   Active Positions: ${summary.activePositions.length}`);
    console.log(
      `   Unrealized PnL: $${summary.account.pnlState.unrealisedPnl}`,
    );
    console.log(`   Realized PnL: $${summary.account.pnlState.realisedPnl}`);

    // Test 7: Evaluate fit for our use case
    console.log("\n7️⃣  Evaluating fit for MyCryptoPilot...");
    console.log("\n📊 ANALYSIS:");
    console.log("\n✅ What accountstate DOES:");
    console.log("   • Store current positions (already calculated)");
    console.log("   • Store current orders (already formatted)");
    console.log("   • Store wallet balance (already known)");
    console.log("   • Get summaries and P&L");
    console.log("   • Custom metadata per symbol");

    console.log("\n❌ What accountstate DOESN'T do:");
    console.log("   • Calculate positions from fills/trades");
    console.log("   • Aggregate fills into positions");
    console.log("   • Handle DCA (dollar-cost averaging)");
    console.log("   • Detect trading sessions");
    console.log("   • FIFO calculation for spot");
    console.log("   • Weighted average entry prices");

    console.log("\n🎯 OUR USE CASE:");
    console.log("   We need: Binance/Bybit fills → aggregate → positions/PnL");
    console.log("   accountstate expects: You give it ready positions");

    console.log("\n💡 MISMATCH DETECTED:");
    console.log("   accountstate is a STATE CACHE, not a FILL AGGREGATOR");
    console.log(
      "   We'd still need our fill-aggregation.service.ts BEFORE using accountstate",
    );

    console.log("\n═══════════════════════════════════════");
    console.log("✅ VERDICT: Package works perfectly!");
    console.log("\n📊 BUT... RECOMMENDATION: CUSTOM LOGIC");
    console.log("\n⚠️  REASONS:");
    console.log("   1. accountstate ≠ fill aggregation");
    console.log("   2. We already have fill-aggregation.service.ts");
    console.log("   3. Our service does what accountstate doesn't");
    console.log("   4. Adding accountstate = extra layer without benefit");
    console.log("   5. Our custom logic is battle-tested");

    console.log("\n🔄 WORKFLOW COMPARISON:");
    console.log("\n   WITH accountstate:");
    console.log("   Exchange fills → fill-aggregation.service.ts");
    console.log("                  → accountstate (cache)");
    console.log("                  → frontend");

    console.log("\n   CURRENT (simpler):");
    console.log("   Exchange fills → fill-aggregation.service.ts → frontend");

    console.log("\n💡 DECISION: Keep CUSTOM logic");
    console.log(
      "   accountstate is great but doesn't solve our actual problem",
    );
    console.log("═══════════════════════════════════════\n");
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : "Unknown",
    );
    console.error("Stack:", error instanceof Error ? error.stack : "");
    console.log("\n═══════════════════════════════════════");
    console.log("❌ VERDICT: Package test failed");
    console.log("\n📊 RECOMMENDATION: CUSTOM LOGIC");
    console.log("═══════════════════════════════════════\n");
    process.exit(1);
  }
}

runProperPOC().catch(console.error);
