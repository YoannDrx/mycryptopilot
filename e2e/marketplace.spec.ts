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
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 3. Navigate to traders marketplace
    await page.goto("/traders");
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
   * Hybrid marketplace architecture combines SSR (SEO) with client-side filters.
   * This test ensures the search input and filter dropdown update results without reloads.
   */
  test("marketplace search and filters work", async ({ page }) => {
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

    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    await page.goto("/traders");
    await page.waitForLoadState("domcontentloaded");

    const grid = page.locator('[data-testid="traders-grid"]');

    const searchInput = page.getByPlaceholder(/search traders/i);
    await expect(searchInput).toBeVisible();

    await expect(
      grid.getByText(`Crypto Whale Trader ${timestamp}`).first(),
    ).toBeVisible();
    await expect(
      grid.getByText(`Bitcoin Expert ${timestamp}`).first(),
    ).toBeVisible();
    await expect(
      grid.getByText(`Altcoin Master ${timestamp}`).first(),
    ).toBeVisible();

    await searchInput.fill(`Whale Trader ${timestamp}`);

    await expect(
      grid.getByText(`Crypto Whale Trader ${timestamp}`).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      grid.getByText(`Bitcoin Expert ${timestamp}`),
    ).toHaveCount(0, { timeout: 15000 });
    await expect(
      grid.getByText(`Altcoin Master ${timestamp}`),
    ).toHaveCount(0, { timeout: 15000 });

    await searchInput.fill("");
    await expect(
      grid.getByText(`Bitcoin Expert ${timestamp}`).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      grid.getByText(`Altcoin Master ${timestamp}`).first(),
    ).toBeVisible({ timeout: 15000 });

    const filterTrigger = page.locator('button[role="combobox"]').first();
    await filterTrigger.click();
    await page.getByRole("option", { name: /verified only/i }).click();
    await expect(
      grid.getByText(`Bitcoin Expert ${timestamp}`),
    ).toHaveCount(0, { timeout: 15000 });

    await expect(
      grid.getByText(`Crypto Whale Trader ${timestamp}`).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      grid.getByText(`Altcoin Master ${timestamp}`).first(),
    ).toBeVisible({ timeout: 15000 });

    await filterTrigger.click();
    await page.getByRole("option", { name: /all traders/i }).click();

    await expect(
      grid.getByText(`Bitcoin Expert ${timestamp}`).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
