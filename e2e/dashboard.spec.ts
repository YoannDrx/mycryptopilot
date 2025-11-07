import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import {
  createTestTraderDirectly,
  createTestSignal,
} from "./utils/trader-test";

test.describe("User Dashboard", () => {
  test("user dashboard displays correct stats", async ({ page }) => {
    // 1. Create a user account
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // 2. Create 2 traders directly in DB (faster, no UI interaction)
    const { user: trader1 } = await createTestTraderDirectly();
    const { user: trader2 } = await createTestTraderDirectly();

    // Create follow relationships
    await prisma.follow.createMany({
      data: [
        {
          userId: user.id,
          traderId: trader1.id,
          status: "ACTIVE",
        },
        {
          userId: user.id,
          traderId: trader2.id,
          status: "ACTIVE",
        },
      ],
    });

    // 3. Create signals from both traders (3 signals each = 6 total active)
    await createTestSignal({ traderId: trader1.id, symbol: "BTC-USDT" });
    await createTestSignal({ traderId: trader1.id, symbol: "ETH-USDT" });
    await createTestSignal({ traderId: trader1.id, symbol: "SOL-USDT" });

    await createTestSignal({ traderId: trader2.id, symbol: "AVAX-USDT" });
    await createTestSignal({ traderId: trader2.id, symbol: "MATIC-USDT" });
    await createTestSignal({ traderId: trader2.id, symbol: "DOT-USDT" });

    // 4. Navigate to dashboard (already logged in as follower user)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 5. Verify stats cards display correct information
    // Verify Active Signals shows 6
    await expect(
      page.getByText("Active Signals").locator("..").locator(".."),
    ).toContainText("6");

    // Verify Traders Followed shows 2
    await expect(
      page.getByText("Traders Followed").locator("..").locator(".."),
    ).toContainText("2");

    // Verify Your Plan shows Free
    await expect(
      page.getByText("Your Plan").locator("..").locator(".."),
    ).toContainText(/free/i);
  });

  test("user dashboard shows signals from followed traders", async ({
    page,
  }) => {
    // 1. Create a user account
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // 2. Create 2 traders directly in DB (faster, no UI interaction)
    const { user: trader1 } = await createTestTraderDirectly();
    const { user: trader2 } = await createTestTraderDirectly();

    // Follow both traders
    await prisma.follow.createMany({
      data: [
        {
          userId: user.id,
          traderId: trader1.id,
          status: "ACTIVE",
        },
        {
          userId: user.id,
          traderId: trader2.id,
          status: "ACTIVE",
        },
      ],
    });

    // 3. Each trader publishes 3 signals (6 total)
    await createTestSignal({
      traderId: trader1.id,
      symbol: "BTC-USDT",
      rationale: "Trader1 Signal 1",
    });
    await createTestSignal({
      traderId: trader1.id,
      symbol: "ETH-USDT",
      rationale: "Trader1 Signal 2",
    });
    await createTestSignal({
      traderId: trader1.id,
      symbol: "SOL-USDT",
      rationale: "Trader1 Signal 3",
    });

    await createTestSignal({
      traderId: trader2.id,
      symbol: "AVAX-USDT",
      rationale: "Trader2 Signal 1",
    });
    await createTestSignal({
      traderId: trader2.id,
      symbol: "MATIC-USDT",
      rationale: "Trader2 Signal 2",
    });
    await createTestSignal({
      traderId: trader2.id,
      symbol: "DOT-USDT",
      rationale: "Trader2 Signal 3",
    });

    // 4. Navigate to dashboard (already logged in as follower user)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 5. Verify all 6 signals are displayed
    await expect(page.getByText("BTC-USDT").first()).toBeVisible();
    await expect(page.getByText("ETH-USDT").first()).toBeVisible();
    await expect(page.getByText("SOL-USDT").first()).toBeVisible();
    await expect(page.getByText("AVAX-USDT").first()).toBeVisible();
    await expect(page.getByText("MATIC-USDT").first()).toBeVisible();
    await expect(page.getByText("DOT-USDT").first()).toBeVisible();

    // Verify signals count header shows (6)
    await expect(page.getByText(/recent signals.*\(6\)/i)).toBeVisible();
  });

  /**
   * ✅ Signal blurring for Free plan users after limit
   *
   * Feature: FREE plan users see first 3 signals clearly, remaining signals blurred
   * (activeSignalsLimit: 3 in mycryptopilot-plans.ts)
   *
   * Implementation:
   * - SignalsFeed checks user's plan from database
   * - BlurredSignalCard applies blur effect after limit
   * - "Upgrade to Pro" CTA overlay on blurred signals
   *
   * Test verifies:
   * 1. Free user created with 10 signals from followed trader
   * 2. First 3 signals are clear (no blur/opacity)
   * 3. Signals 4-10 have blur effect
   * 4. "Upgrade to Pro" CTA is visible on blurred signals
   * 5. CTA redirects to /pricing page
   */
  test("free user sees blurred signals after limit", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Verify user is on Free plan
    expect(user.planName).toBe("free");

    // Create a trader directly in DB with 10 signals
    const { user: trader } = await createTestTraderDirectly();

    await prisma.follow.create({
      data: {
        userId: user.id,
        traderId: trader.id,
        status: "ACTIVE",
      },
    });

    // Create 10 signals (sequentially to avoid timestamp conflicts)
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      await createTestSignal({
        traderId: trader.id,
        symbol: `ASSET${i + 1}-USDT`,
        rationale: `Signal ${i + 1}`,
      });
    }

    // Verify 10 signals were created in database
    const dbSignals = await prisma.signal.count({
      where: { traderId: trader.id },
    });
    expect(dbSignals).toBe(10);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify all 10 signal cards are rendered
    const signalCards = page.locator('[data-testid="trading-card"]');
    const totalCards = await signalCards.count();
    expect(totalCards).toBe(10);

    // Verify first 3 signals are NOT blurred (FREE plan activeSignalsLimit = 3)
    for (let i = 0; i < 3; i++) {
      const card = signalCards.nth(i);
      // Check that card or its parents don't have blur class
      // eslint-disable-next-line no-await-in-loop
      const hasBlur = await card.evaluate((el) => {
        // Check if any parent has blur-sm class
        let current = el.parentElement;
        while (current) {
          if (current.classList.contains("blur-sm")) return true;
          current = current.parentElement;
        }
        return false;
      });
      expect(hasBlur).toBe(false);
    }

    // Verify signals 4-10 ARE blurred (indices 3-9)
    for (let i = 3; i < 10; i++) {
      const card = signalCards.nth(i);
      // Check that card or its parents have blur class
      // eslint-disable-next-line no-await-in-loop
      const hasBlur = await card.evaluate((el) => {
        // Check if any parent has blur-sm class
        let current = el.parentElement;
        while (current) {
          if (current.classList.contains("blur-sm")) return true;
          current = current.parentElement;
        }
        return false;
      });
      expect(hasBlur).toBe(true);

      // Verify "Upgrade to Pro" CTA is visible in blurred card area
      // The CTA is in a sibling overlay div, not inside the card
      const container = signalCards.nth(i).locator("..").locator("..");
      const upgradeButton = container.getByRole("link", { name: /upgrade to pro/i });
      // eslint-disable-next-line no-await-in-loop
      await expect(upgradeButton).toBeVisible();
    }

    // Click first blurred signal's "Upgrade to Pro" CTA
    // Since only blurred signals (4-10) have upgrade buttons, .first() gets button from signal #4
    const upgradeButton = page.getByRole("link", { name: /upgrade to pro/i }).first();
    await upgradeButton.click();

    // Verify redirect to pricing page
    await page.waitForURL(/\/pricing/, { timeout: 5000 });
    expect(page.url()).toContain("/pricing");
  });

  test("dashboard tabs navigation works", async ({ page }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 3. Verify default tab is "Signals Feed" (active by default)
    const signalsTab = page.getByRole("tab", { name: /signals feed/i });
    await expect(signalsTab).toBeVisible();
    await expect(signalsTab).toHaveAttribute("data-state", "active");

    // 4. Navigate to "Trading Journal" tab
    const journalTab = page.getByRole("tab", { name: /trading journal/i });
    await expect(journalTab).toBeVisible();
    await journalTab.click();
    await page.waitForLoadState("networkidle");

    // Verify Trading Journal tab is active
    await expect(journalTab).toHaveAttribute("data-state", "active");
    await expect(page.getByText(/trading journal coming soon/i)).toBeVisible();

    // 5. Navigate to "Performance" tab
    const performanceTab = page.getByRole("tab", { name: /performance/i });
    await expect(performanceTab).toBeVisible();
    await performanceTab.click();
    await page.waitForLoadState("networkidle");

    // Verify Performance tab is active
    await expect(performanceTab).toHaveAttribute("data-state", "active");
    await expect(page.getByText(/win rate/i).first()).toBeVisible();
    await expect(page.getByText(/profit factor/i).first()).toBeVisible();
    await expect(page.getByText(/equity curve/i).first()).toBeVisible();

    // 6. Navigate back to Signals Feed tab
    await signalsTab.click();
    await page.waitForLoadState("networkidle");

    // Verify Signals Feed tab is active again
    await expect(signalsTab).toHaveAttribute("data-state", "active");
  });
});
