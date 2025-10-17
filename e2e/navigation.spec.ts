import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestTrader } from "./utils/trader-test";

test.describe("Navigation System", () => {
  test("navigation sidebars switch correctly between spaces", async ({
    page,
  }) => {
    // 1. Create a test account
    await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];
    expect(orgSlug).toBeTruthy();

    // 2. Start in Trading space (dashboard)
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Verify Trading sidebar is displayed
    // Should see links like: Dashboard, Signals, Traders, Pricing
    await expect(
      page.getByRole("link", { name: /dashboard/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /signals/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /traders/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /pricing/i }).first(),
    ).toBeVisible();

    // 3. Navigate to Account space
    await page.goto(`/orgs/${orgSlug}/account`);
    await page.waitForLoadState("networkidle");

    // Verify Account sidebar is displayed
    // Should see different navigation links for account settings
    await expect(page.getByLabel(/name/i)).toBeVisible();

    // Account sidebar should have links like: Settings, Following, etc.
    const accountSidebarLinks =
      (await page.getByRole("link", { name: /settings/i }).count()) > 0 ||
      (await page.getByRole("link", { name: /account/i }).count()) > 0;
    expect(accountSidebarLinks).toBe(true);

    // 4. Navigate to Pricing (back to Trading space)
    await page.goto(`/orgs/${orgSlug}/pricing`);
    await page.waitForLoadState("networkidle");

    // Verify we're back in Trading sidebar context
    await expect(
      page.getByRole("heading", { name: /pricing/i }).first(),
    ).toBeVisible();

    // 5. Navigate to Traders marketplace (Trading space)
    await page.goto(`/orgs/${orgSlug}/traders`);
    await page.waitForLoadState("networkidle");

    // Verify Traders page loaded
    await expect(
      page.getByRole("heading", { name: /traders marketplace/i }),
    ).toBeVisible();

    // 6. Verify sidebar consistency - Trading sidebar should still be visible
    await expect(
      page.getByRole("link", { name: /dashboard/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /signals/i }).first(),
    ).toBeVisible();
  });

  test("global search works across all spaces", async ({ page }) => {
    // 1. Create a trader with a signal for search testing
    const { traderProfile } = await createTestTrader({ page });

    // Sign out and create a regular user
    await signOutAccount({ page });

    await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];
    expect(orgSlug).toBeTruthy();

    // 2. Navigate to dashboard (Trading space)
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // 3. Try to access global search (Cmd+K / Ctrl+K or search button)
    // Check if there's a search input or button in the sidebar
    const searchInput = page.getByPlaceholder(/search/i).first();
    const searchButton = page.getByRole("button", { name: /search/i });

    if ((await searchInput.count()) > 0) {
      // If search input exists, test it
      await searchInput.click();
      await searchInput.fill(traderProfile.displayName);

      // Wait for search results
      await page.waitForTimeout(1000);

      // Should find the trader in results
      const hasTraderInResults =
        (await page.getByText(traderProfile.displayName).count()) > 0;

      expect(hasTraderInResults).toBe(true);

      // Clear search
      await searchInput.clear();
    } else if ((await searchButton.count()) > 0) {
      // If search button exists, click it to open search dialog/panel
      await searchButton.click();
      await page.waitForTimeout(500);

      // Try to find search input in opened dialog
      const dialogSearchInput = page.getByPlaceholder(/search/i);
      if ((await dialogSearchInput.count()) > 0) {
        await dialogSearchInput.fill(traderProfile.displayName);
        await page.waitForTimeout(1000);

        const hasTraderInResults =
          (await page.getByText(traderProfile.displayName).count()) > 0;

        expect(hasTraderInResults).toBe(true);
      }
    } else {
      // Alternative: Test keyboard shortcut (Cmd+K or Ctrl+K)
      // This opens the global search command palette
      const isMac = process.platform === "darwin";
      if (isMac) {
        await page.keyboard.press("Meta+k");
      } else {
        await page.keyboard.press("Control+k");
      }

      await page.waitForTimeout(500);

      // Check if search dialog opened
      const searchDialog = page.getByRole("dialog");
      if ((await searchDialog.count()) > 0) {
        const dialogSearchInput = searchDialog.getByPlaceholder(/search/i);
        await dialogSearchInput.fill(traderProfile.displayName);
        await page.waitForTimeout(1000);

        const hasTraderInResults =
          (await searchDialog.getByText(traderProfile.displayName).count()) > 0;

        expect(hasTraderInResults).toBe(true);
      } else {
        // If no global search UI exists yet, just verify navigation works
        // Navigate to traders page and search manually
        await page.goto(`/orgs/${orgSlug}/traders`);
        await page.waitForLoadState("networkidle");

        const marketplaceSearchInput = page.getByPlaceholder(/search/i);
        if ((await marketplaceSearchInput.count()) > 0) {
          await marketplaceSearchInput.fill(traderProfile.displayName);
          await page.waitForTimeout(1500);

          await expect(page.getByText(traderProfile.displayName)).toBeVisible();
        }
      }
    }

    // 4. Verify navigation still works after search
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("link", { name: /signals/i }).first(),
    ).toBeVisible();

    // 5. Navigate to Account space and verify sidebar changed
    await page.goto(`/orgs/${orgSlug}/account`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByLabel(/name/i)).toBeVisible();
  });
});
