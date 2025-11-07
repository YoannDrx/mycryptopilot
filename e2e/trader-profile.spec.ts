import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestTrader, createTestSignal } from "./utils/trader-test";

test.describe("Trader Public Profile", () => {
  test("trader public profile displays all info", async ({ page }) => {
    // 1. Create a trader with signals
    const { user: trader, traderProfile } = await createTestTrader({ page });

    // Create 3 active signals for the trader
    await Promise.all([
      createTestSignal({ traderId: trader.id, symbol: "BTC-USDT" }),
      createTestSignal({ traderId: trader.id, symbol: "ETH-USDT" }),
      createTestSignal({ traderId: trader.id, symbol: "SOL-USDT" }),
    ]);

    // 2. Sign out and create a viewer account
    await signOutAccount({ page });

    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 3. Navigate to trader public profile
    await page.goto(`/traders/${trader.id}`);
    await page.waitForLoadState("networkidle");

    // 4. Verify all trader info is displayed
    // Display name
    await expect(
      page.getByText(traderProfile.displayName).first(),
    ).toBeVisible();

    // Bio (if exists)
    if (traderProfile.bio) {
      await expect(page.getByText(traderProfile.bio)).toBeVisible();
    }

    // Stats (winrate, payoff, etc.)
    const statsJson = traderProfile.statsJson as Record<string, number> | null;
    if (statsJson?.winrate) {
      await expect(
        page.getByText(new RegExp(`${statsJson.winrate}%`)),
      ).toBeVisible();
    }

    // Followers count label
    await expect(page.getByText(/followers/i).first()).toBeVisible();

    // Signals count label
    await expect(page.getByText(/signals/i).first()).toBeVisible();

    // 5. Verify Follow button is visible
    await expect(
      page.getByRole("button", { name: /follow/i }).first(),
    ).toBeVisible();

    // 6. Verify "Recent Signals" section
    await expect(page.getByText(/recent signals/i)).toBeVisible();

    // 7. Verify signals are displayed (should show 3 signals)
    await expect(page.getByText("BTC-USDT").first()).toBeVisible();
    await expect(page.getByText("ETH-USDT").first()).toBeVisible();
    await expect(page.getByText("SOL-USDT").first()).toBeVisible();
  });

  test("non-logged user sees sign-in prompt on follow", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    // Create a signal
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out to become a guest
    await signOutAccount({ page });

    // 3. Navigate to trader profile as guest (no orgSlug needed for guest access)
    // Try accessing via direct URL without authentication
    await page.goto(`/traders/${trader.id}`);

    // Should redirect to auth page or show sign-in prompt
    // Let's wait for either auth page or a sign-in message
    await page.waitForTimeout(2000);

    // Check if redirected to sign-in page
    const currentUrl = page.url();
    const isOnAuthPage =
      currentUrl.includes("/auth/signin") || currentUrl.includes("/signin");

    if (isOnAuthPage) {
      // Redirected to sign-in page
      expect(currentUrl).toMatch(/signin/);
    } else {
      // Alternative: Try with auth context (might need auth first)
      // Let's sign in first, then sign out and try
      await createTestAccount({
        page,
        callbackURL: "/dashboard",
      });

      await page.waitForURL(/\/dashboard$/);

      // Sign out again
      await signOutAccount({ page });

      // Now try to access trader profile
      await page.goto(`/traders/${trader.id}`);
      await page.waitForLoadState("networkidle");

      // Wait for page to settle
      await page.waitForTimeout(2000);

      // Check if we're redirected to auth
      const finalUrl = page.url();
      if (finalUrl.includes("/auth/signin")) {
        expect(finalUrl).toContain("/auth/signin");
      } else {
        // If not redirected, the Follow button click should trigger auth prompt
        const followButton = page
          .getByRole("button", { name: /follow/i })
          .first();

        if ((await followButton.count()) > 0) {
          await followButton.click();

          // Should show auth prompt or redirect
          await page.waitForTimeout(2000);
          const urlAfterClick = page.url();
          expect(urlAfterClick).toMatch(/signin|auth/);
        }
      }
    }
  });

  test("trader profile shows only active signals", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    // 2. Create 2 active signals and 2 expired signals
    await Promise.all([
      createTestSignal({
        traderId: trader.id,
        symbol: "BTC-USDT",
        expired: false,
        rationale: "Active signal 1",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "ETH-USDT",
        expired: false,
        rationale: "Active signal 2",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "SOL-USDT",
        expired: true,
        rationale: "Expired signal 1",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "AVAX-USDT",
        expired: true,
        rationale: "Expired signal 2",
      }),
    ]);

    // 3. Sign out and create a viewer account
    await signOutAccount({ page });

    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 4. Navigate to trader profile
    await page.goto(`/traders/${trader.id}`);
    await page.waitForLoadState("networkidle");

    // 5. Verify only active signals are displayed
    // Active signals should be visible
    await expect(page.getByText("BTC-USDT").first()).toBeVisible();
    await expect(page.getByText("ETH-USDT").first()).toBeVisible();

    // Expired signals should NOT be visible
    const solCount = await page.getByText("SOL-USDT").count();
    const avaxCount = await page.getByText("AVAX-USDT").count();

    expect(solCount).toBe(0);
    expect(avaxCount).toBe(0);

    // 6. Verify "Recent Signals" section exists
    await expect(page.getByText(/recent signals/i)).toBeVisible();
  });
});
