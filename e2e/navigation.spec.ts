import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Navigation System", () => {
  test("navigation sidebars switch correctly between spaces", async ({
    page,
  }) => {
    // 1. Create a test account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Start in Trading space (dashboard)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify Trading sidebar is displayed
    // Should see links like: Dashboard, Signals Feed, Traders Marketplace, Upgrade Plan
    await expect(
      page.getByRole("link", { name: /dashboard/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /signals feed/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /traders/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /upgrade plan/i }).first(),
    ).toBeVisible();

    // 3. Navigate to Account space (hub with cards)
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    // Verify Account hub is displayed with cards
    await expect(page.getByText(/profile settings/i)).toBeVisible();

    // Account sidebar should have links like: Settings, Following, etc.
    const accountSidebarLinks =
      (await page.getByRole("link", { name: /settings/i }).count()) > 0 ||
      (await page.getByRole("link", { name: /account/i }).count()) > 0;
    expect(accountSidebarLinks).toBe(true);

    // 4. Navigate to Pricing (back to Trading space)
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Verify we're back in Trading sidebar context
    await expect(
      page.getByRole("heading", { name: /pricing/i }).first(),
    ).toBeVisible();

    // 5. Navigate to Traders marketplace (Trading space)
    await page.goto("/traders");
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
      page.getByRole("link", { name: /signals feed/i }).first(),
    ).toBeVisible();
  });

  /**
   * ✅ TEST UPDATED - Navigation reorganization (Issue #81)
   *
   * After sidebar reorganization:
   * - Trading: "Dashboard" in MY FEED section
   * - Trading: "Signals Feed" in DISCOVER section
   * - Note: "Following" appears in both Trading (MY FEED) and Account
   * - Using "Dashboard" for search to avoid ambiguity
   *
   * This ensures GlobalSearchCommand results work with new structure.
   */
  test("global search works across all spaces", async ({ page }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to dashboard (Trading space)
    await page.goto("/dashboard");
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
    await expect(page).toHaveURL(/\/traders$/);

    // 4. Try global search from another space (Account settings)
    await page.goto("/account/settings");
    await page.waitForLoadState("networkidle");

    // Open search again
    const searchInput2 = page.getByPlaceholder("Search...").first();
    await searchInput2.click();
    await page.waitForTimeout(500);

    // Verify command dialog is visible again
    const dialogInput2 = page.getByPlaceholder(/type to search/i);
    await expect(dialogInput2).toBeVisible();

    // Search for Dashboard link (unique in Trading MY FEED section)
    await dialogInput2.fill("Dashboard");
    await page.waitForTimeout(500);

    // Should find "Dashboard" link in results (points to /dashboard)
    const dashboardLink = page.getByRole("option", { name: /dashboard/i });
    await expect(dashboardLink).toBeVisible();

    // Click on the result to navigate
    await dashboardLink.click();

    // Verify navigation happened (Dashboard points to /dashboard)
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
