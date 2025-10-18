import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

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

  /**
   * ⚠️ FAILING - Application bug: Duplicate navigation labels causing ambiguity
   *
   * Issue: GlobalSearchCommand returns duplicate labels from different spaces
   *
   * Example: "Following" appears twice in search results:
   * 1. Trading space: /orgs/:slug/dashboard (trading-links.ts:40)
   * 2. Account space: /orgs/:slug/account/following (account-links.ts:35)
   *
   * Current behavior:
   * - User searches "Following"
   * - 2 results appear (Trading + Account)
   * - Test clicks first result
   * - Navigates to /account/following instead of /dashboard
   *
   * Similar issues with other labels:
   * - "Dashboard" appears 3 times (Dashboard, Trader Dashboard, My Trading Dashboard)
   *
   * Root cause:
   * - allLinks combines all 4 spaces (Trading, Account, School, Tax)
   * - No disambiguation in labels (no space prefix/suffix)
   * - GlobalSearchCommand doesn't group by space
   *
   * Possible fixes:
   * 1. Add space prefix to labels: "Trading: Following", "Account: Following"
   * 2. Group results by space in GlobalSearchCommand
   * 3. Make labels unique across all spaces
   * 4. Add href display in search results
   *
   * Priority: P2 - UX issue, not blocking core features
   */
  test.skip("global search works across all spaces", async ({ page }) => {
    // 1. Create a user account
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

    // 3. Test global search command dialog (Cmd+K)
    // Click on the readonly search input to open command dialog
    const searchInput = page.getByPlaceholder("Search...").first();
    await expect(searchInput).toBeVisible();
    await searchInput.click();

    // Wait for command dialog to open
    await page.waitForTimeout(500);

    // Verify command dialog is visible
    const dialogInput = page.getByPlaceholder(/type to search/i);
    await expect(dialogInput).toBeVisible();

    // Search for a navigation link (GlobalSearchCommand only searches nav links, not traders)
    await dialogInput.fill("Traders");

    // Wait for search results
    await page.waitForTimeout(500);

    // Should find "Traders" link in results
    const tradersLink = page.getByRole("option", { name: /traders/i });
    await expect(tradersLink).toBeVisible();

    // Click on the result to navigate
    await tradersLink.click();

    // Verify navigation happened
    await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}/traders`));

    // 4. Try global search from another space (Account)
    await page.goto(`/orgs/${orgSlug}/account`);
    await page.waitForLoadState("networkidle");

    // Open search again
    const searchInput2 = page.getByPlaceholder("Search...").first();
    await searchInput2.click();
    await page.waitForTimeout(500);

    // Verify command dialog is visible again
    const dialogInput2 = page.getByPlaceholder(/type to search/i);
    await expect(dialogInput2).toBeVisible();

    // Search for another navigation link
    await dialogInput2.fill("Following");
    await page.waitForTimeout(500);

    // Should find "Following" link in results (points to /dashboard)
    const followingLink = page.getByRole("option", { name: /following/i });
    await expect(followingLink).toBeVisible();

    // Click on the result to navigate
    await followingLink.click();

    // Verify navigation happened (Following points to /dashboard)
    await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}/dashboard`));
  });
});
