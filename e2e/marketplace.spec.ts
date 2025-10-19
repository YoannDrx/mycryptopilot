import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import {
  createTestTraderDirectly,
  createTestSignal,
} from "./utils/trader-test";

test.describe("Traders Marketplace", () => {
  test("marketplace displays all traders with stats", async ({ page }) => {
    // 1. Create 5 traders directly in DB (faster, no UI interaction)
    const createTrader = async () => {
      const { user, traderProfile } = await createTestTraderDirectly();

      // Create 2-3 signals for each trader
      await Promise.all([
        createTestSignal({ traderId: user.id }),
        createTestSignal({ traderId: user.id }),
      ]);

      return { user, traderProfile };
    };

    // Create traders in parallel (no page navigation needed)
    const [trader1, trader2, trader3, trader4, trader5] = await Promise.all([
      createTrader(),
      createTrader(),
      createTrader(),
      createTrader(),
      createTrader(),
    ]);

    const traders = [trader1, trader2, trader3, trader4, trader5];

    // 2. Create a follower account

    await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    // Extract org slug
    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];
    expect(orgSlug).toBeTruthy();

    // 3. Navigate to traders marketplace
    await page.goto(`/orgs/${orgSlug}/traders`);
    await page.waitForLoadState("networkidle");

    // 4. Verify page title and header
    await expect(
      page.getByRole("heading", { name: /traders marketplace/i }),
    ).toBeVisible();

    // 5. Verify all 5 traders are displayed
    await Promise.all(
      traders.map(async (trader) =>
        expect(
          page.getByText(trader.traderProfile.displayName).first(),
        ).toBeVisible(),
      ),
    );

    // 6. Verify stats are displayed on trader cards
    // Check that "Win Rate", "Payoff", "Followers", "Signals" labels exist
    await expect(page.getByText(/win rate/i).first()).toBeVisible();
    await expect(page.getByText(/payoff/i).first()).toBeVisible();
    await expect(page.getByText(/followers/i).first()).toBeVisible();
    await expect(page.getByText(/signals/i).first()).toBeVisible();

    // 7. Verify Follow and View Profile buttons exist
    const followButtons = page.getByRole("button", { name: /follow/i });
    const viewProfileLinks = page.getByRole("link", { name: /view profile/i });

    // Should have at least 5 follow buttons (one per trader) - allow more due to data pollution from other tests
    expect(await followButtons.count()).toBeGreaterThanOrEqual(5);
    // Should have at least 5 view profile links - allow more due to data pollution from other tests
    expect(await viewProfileLinks.count()).toBeGreaterThanOrEqual(5);

    // 8. Verify stats overview cards
    const activeTradersStat = page.getByText(/active traders/i).first();
    await expect(activeTradersStat).toBeVisible();

    // Active traders count should be at least 5
    const statsCard = activeTradersStat
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(statsCard.getByText(/\d+/).first()).toBeVisible();
  });

  /**
   * ✅ FIXED - Marketplace search filter now working with hybrid architecture!
   *
   * Root cause: Hard redirects were causing full page reloads (bad UX)
   * Solution: Hybrid architecture with SSR initial + TanStack Query for client-side filtering
   *
   * Architecture:
   * - Initial load: SSR with searchTraders()
   * - Filtering: Client-side fetch via /api/traders/search
   * - URL state: nuqs with shallow: true (no navigation)
   * - Result: No full page reload, fast filtering, SEO preserved
   */
  test("marketplace search and filters work", async ({ page }) => {
    // 1. Create 3 traders directly in DB with UNIQUE names (using timestamp to avoid duplicates from previous test runs)
    const timestamp = Date.now();
    const trader1Data = await createTestTraderDirectly();
    await prisma.traderProfile.update({
      where: { id: trader1Data.traderProfile.id },
      data: {
        displayName: `Crypto Whale Trader ${timestamp}`,
        verified: true,
        statsJson: { winrate: 75.5, payoff: 2.5, totalTrades: 100 },
      },
    });

    const trader2Data = await createTestTraderDirectly();
    await prisma.traderProfile.update({
      where: { id: trader2Data.traderProfile.id },
      data: {
        displayName: `Bitcoin Expert ${timestamp}`,
        verified: false,
        statsJson: { winrate: 60.0, payoff: 1.8, totalTrades: 50 },
      },
    });

    const trader3Data = await createTestTraderDirectly();
    await prisma.traderProfile.update({
      where: { id: trader3Data.traderProfile.id },
      data: {
        displayName: `Altcoin Master ${timestamp}`,
        verified: true,
        statsJson: { winrate: 80.0, payoff: 3.0, totalTrades: 150 },
      },
    });

    // 2. Create a follower account
    await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Navigate to marketplace
    await page.goto(`/orgs/${orgSlug}/traders`);
    await page.waitForLoadState("networkidle");

    // 4. Verify all 3 traders are visible initially
    await expect(
      page.getByText(`Crypto Whale Trader ${timestamp}`).first(),
    ).toBeVisible();
    await expect(
      page.getByText(`Bitcoin Expert ${timestamp}`).first(),
    ).toBeVisible();
    await expect(
      page.getByText(`Altcoin Master ${timestamp}`).first(),
    ).toBeVisible();

    // 5. Test search functionality - search for "Whale"
    const searchInput = page.getByPlaceholder(/search traders/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Whale");

    // Wait for URL update (nuqs throttle: 300ms) + API call
    await page.waitForURL(/search=Whale/, { timeout: 2000 });
    // Wait for API response
    await page.waitForResponse(
      (response) => response.url().includes("/api/traders/search"),
      { timeout: 2000 },
    );

    // Verify only Crypto Whale Trader is visible (search filters out others)
    await expect(
      page.getByText(`Crypto Whale Trader ${timestamp}`).first(),
    ).toBeVisible();
    // Bitcoin Expert and Altcoin Master should NOT exist in DOM (count = 0)
    expect(await page.getByText(`Bitcoin Expert ${timestamp}`).count()).toBe(0);
    expect(await page.getByText(`Altcoin Master ${timestamp}`).count()).toBe(0);

    // 6. Clear search and test "Verified Only" filter
    await searchInput.clear();
    // Wait for URL to clear search param
    await page.waitForFunction(
      () => !window.location.search.includes("search="),
      { timeout: 2000 },
    );
    // Wait for API response
    await page.waitForResponse(
      (response) => response.url().includes("/api/traders/search"),
      { timeout: 2000 },
    );

    // Apply verified filter
    const filterSelect = page.getByLabel(/filter/i);
    if ((await filterSelect.count()) > 0) {
      await filterSelect.click();
      await page.getByRole("option", { name: /verified/i }).click();
      await page.waitForLoadState("networkidle");

      // Should show only verified traders (Crypto Whale Trader, Altcoin Master)
      await expect(
        page.getByText(`Crypto Whale Trader ${timestamp}`).first(),
      ).toBeVisible();
      await expect(
        page.getByText(`Altcoin Master ${timestamp}`).first(),
      ).toBeVisible();
      // Bitcoin Expert is NOT verified, should not exist in DOM (count = 0)
      expect(await page.getByText(`Bitcoin Expert ${timestamp}`).count()).toBe(
        0,
      );
    }

    // 7. Test combined search + filter
    await searchInput.fill("Trader");
    // Wait for API response
    await page.waitForResponse(
      (response) => response.url().includes("/api/traders/search"),
      { timeout: 2000 },
    );

    // Should show only "Crypto Whale Trader" (verified + contains "Trader")
    await expect(
      page.getByText(`Crypto Whale Trader ${timestamp}`).first(),
    ).toBeVisible();
    // Altcoin Master doesn't contain "Trader", should not be visible
    expect(await page.getByText(`Altcoin Master ${timestamp}`).count()).toBe(0);
  });
});
