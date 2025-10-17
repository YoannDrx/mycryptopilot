import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { createTestTrader, createTestSignal } from "./utils/trader-test";

test.describe("User Dashboard", () => {
  test("user dashboard displays correct stats", async ({ page }) => {
    // 1. Create a user account
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Extract org slug
    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];
    expect(orgSlug).toBeTruthy();

    // 2. Create 2 traders and make user follow them
    const { user: trader1 } = await createTestTrader({
      page,
    });

    const { user: trader2 } = await createTestTrader({
      page,
    });

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

    // 4. Navigate to dashboard
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // 5. Verify stats cards display correct information
    // Active Signals card
    const activeSignalsCard = page
      .locator('[role="main"]')
      .getByText("Active Signals")
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(activeSignalsCard.getByText("6")).toBeVisible();

    // Traders Followed card
    const tradersFollowedCard = page
      .locator('[role="main"]')
      .getByText("Traders Followed")
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(tradersFollowedCard.getByText("2")).toBeVisible();

    // Your Plan card (should show Free for new user)
    const yourPlanCard = page
      .locator('[role="main"]')
      .getByText("Your Plan")
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(yourPlanCard.getByText(/free/i)).toBeVisible();
  });

  test("user dashboard shows signals from followed traders", async ({
    page,
  }) => {
    // 1. Create a user account
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 2. Create 2 traders
    const { user: trader1 } = await createTestTrader({
      page,
    });

    const { user: trader2 } = await createTestTrader({
      page,
    });

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

    // 4. Navigate to dashboard
    await page.goto(`/orgs/${orgSlug}/dashboard`);
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

  test.skip("free user sees blurred signals after limit", async ({ page }) => {
    // TODO: This test is skipped because the blurring functionality is not yet implemented
    // Free users should see max 3 clear signals (activeSignalsLimit: 3 in mycryptopilot-plans.ts)
    // Additional signals should be blurred with "Upgrade to Pro" CTA
    //
    // Implementation needed in SignalsFeed component:
    // - Check user's plan (Free/Pro/Ultra)
    // - Get plan limits (activeSignalsLimit)
    // - Render first N signals normally
    // - Render remaining signals with blur effect + upgrade CTA
    //
    // Once implemented, this test should:
    // 1. Create Free user
    // 2. Follow trader with 10+ signals
    // 3. Navigate to dashboard
    // 4. Verify first 3 signals are clear
    // 5. Verify signals 4+ are blurred
    // 6. Verify "Upgrade to Pro" CTA is visible

    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Verify user is on Free plan
    expect(user.planName).toBe("free");

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // Create a trader with 10 signals
    const { user: trader } = await createTestTrader({
      page,
    });

    await prisma.follow.create({
      data: {
        userId: user.id,
        traderId: trader.id,
        status: "ACTIVE",
      },
    });

    // Create 10 signals
    await Promise.all(
      Array.from({ length: 10 }, async (_, i) =>
        createTestSignal({
          traderId: trader.id,
          symbol: `ASSET${i + 1}-USDT`,
          rationale: `Signal ${i + 1}`,
        }),
      ),
    );

    // Navigate to dashboard
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // TODO: Once implemented, verify:
    // - First 3 signals are clear (no blur/opacity)
    // - Signals 4-10 have blur effect or reduced opacity
    // - "Upgrade to Pro" or similar CTA is visible
    // - CTA links to /pricing or /checkout
  });

  test("dashboard tabs navigation works", async ({ page }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 2. Navigate to dashboard
    await page.goto(`/orgs/${orgSlug}/dashboard`);
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
    await expect(page.getByText(/win rate/i)).toBeVisible();
    await expect(page.getByText(/profit factor/i)).toBeVisible();
    await expect(page.getByText(/equity curve/i)).toBeVisible();

    // 6. Navigate back to Signals Feed tab
    await signalsTab.click();
    await page.waitForLoadState("networkidle");

    // Verify Signals Feed tab is active again
    await expect(signalsTab).toHaveAttribute("data-state", "active");
  });
});
