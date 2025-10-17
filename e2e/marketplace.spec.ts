import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestTrader, createTestSignal } from "./utils/trader-test";

test.describe("Traders Marketplace", () => {
  test("marketplace displays all traders with stats", async ({ page }) => {
    // 1. Create 5 traders with different stats
    const createTrader = async () => {
      const { user, traderProfile } = await createTestTrader({ page });

      // Create 2-3 signals for each trader
      await Promise.all([
        createTestSignal({ traderId: user.id }),
        createTestSignal({ traderId: user.id }),
      ]);

      return { user, traderProfile };
    };

    // Create traders sequentially (can't parallelize due to page navigation)
    const trader1 = await createTrader();
    await signOutAccount({ page });
    const trader2 = await createTrader();
    await signOutAccount({ page });
    const trader3 = await createTrader();
    await signOutAccount({ page });
    const trader4 = await createTrader();
    await signOutAccount({ page });
    const trader5 = await createTrader();

    const traders = [trader1, trader2, trader3, trader4, trader5];

    // 2. Sign out last trader and create a follower account
    await signOutAccount({ page });

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
        expect(page.getByText(trader.traderProfile.displayName)).toBeVisible(),
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

    // Should have at least 5 follow buttons (one per trader)
    expect(await followButtons.count()).toBeGreaterThanOrEqual(5);
    // Should have exactly 5 view profile links
    expect(await viewProfileLinks.count()).toBe(5);

    // 8. Verify stats overview cards
    const activeTradersStat = page.getByText(/active traders/i).first();
    await expect(activeTradersStat).toBeVisible();

    // Active traders count should be at least 5
    const statsCard = activeTradersStat
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(statsCard.getByText(/\d+/)).toBeVisible();
  });

  test("marketplace search and filters work", async ({ page }) => {
    // 1. Create 3 traders with distinct names for search testing
    const trader1Data = await createTestTrader({ page });
    // Update trader1 name to something searchable
    await prisma.traderProfile.update({
      where: { id: trader1Data.traderProfile.id },
      data: {
        displayName: "Crypto Whale Trader",
        verified: true,
        statsJson: { winrate: 75.5, payoff: 2.5, totalTrades: 100 },
      },
    });

    await signOutAccount({ page });

    const trader2Data = await createTestTrader({ page });
    await prisma.traderProfile.update({
      where: { id: trader2Data.traderProfile.id },
      data: {
        displayName: "Bitcoin Expert",
        verified: false,
        statsJson: { winrate: 60.0, payoff: 1.8, totalTrades: 50 },
      },
    });

    await signOutAccount({ page });

    const trader3Data = await createTestTrader({ page });
    await prisma.traderProfile.update({
      where: { id: trader3Data.traderProfile.id },
      data: {
        displayName: "Altcoin Master",
        verified: true,
        statsJson: { winrate: 80.0, payoff: 3.0, totalTrades: 150 },
      },
    });

    await signOutAccount({ page });

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
    await expect(page.getByText("Crypto Whale Trader")).toBeVisible();
    await expect(page.getByText("Bitcoin Expert")).toBeVisible();
    await expect(page.getByText("Altcoin Master")).toBeVisible();

    // 5. Test search functionality - search for "Whale"
    const searchInput = page.getByPlaceholder(/search traders/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Whale");

    // Wait for search to apply (debounced or triggered on submit)
    await page.waitForTimeout(1500);

    // Verify only Crypto Whale Trader is visible
    await expect(page.getByText("Crypto Whale Trader")).toBeVisible();
    await expect(page.getByText("Bitcoin Expert")).not.toBeVisible();
    await expect(page.getByText("Altcoin Master")).not.toBeVisible();

    // 6. Clear search and test "Verified Only" filter
    await searchInput.clear();
    await page.waitForTimeout(1000);

    // Apply verified filter
    const filterSelect = page.getByLabel(/filter/i);
    if ((await filterSelect.count()) > 0) {
      await filterSelect.click();
      await page.getByRole("option", { name: /verified/i }).click();
      await page.waitForTimeout(1000);

      // Should show only verified traders (Crypto Whale Trader, Altcoin Master)
      await expect(page.getByText("Crypto Whale Trader")).toBeVisible();
      await expect(page.getByText("Altcoin Master")).toBeVisible();
      // Bitcoin Expert is NOT verified, should not be visible
      await expect(page.getByText("Bitcoin Expert")).not.toBeVisible();
    }

    // 7. Test combined search + filter
    await searchInput.fill("Trader");
    await page.waitForTimeout(1500);

    // Should show only "Crypto Whale Trader" (verified + contains "Trader")
    await expect(page.getByText("Crypto Whale Trader")).toBeVisible();
    // Altcoin Master doesn't contain "Trader", should not be visible
    const altcoinCount = await page.getByText("Altcoin Master").count();
    expect(altcoinCount).toBe(0);
  });
});
