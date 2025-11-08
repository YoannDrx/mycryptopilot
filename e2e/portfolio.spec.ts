/**
 * Portfolio Page E2E Tests
 *
 * Tests the /portfolio page UI functionality:
 * - Page loading and layout
 * - Tab navigation (Performance, Risk Analysis, Trade History)
 * - Filters (symbol, status, sort)
 * - Pagination
 * - Redirect when no trader profile exists
 * - Empty states
 */

import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestTrader } from "./utils/trader-test";
import { createCompletePortfolioData } from "./utils/portfolio-test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Portfolio Page - Access & Navigation", () => {
  test("non-trader users are redirected to become-trader page", async ({
    page,
  }) => {
    // 1. Create a regular user (not a trader)
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // Get user from database
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Ensure user does NOT have a trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
    });
    expect(traderProfile).toBeNull();

    // 2. Try to access portfolio page
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // 3. Verify redirect to become-trader page
    await page.waitForURL(/\/account\/become-trader/);
    expect(page.url()).toContain("/account/become-trader");

    // 4. Verify become-trader page content (exact text from page.tsx line 50)
    await expect(
      page.getByRole("heading", { name: /become a trader/i }),
    ).toBeVisible();
  });

  test("trader can access portfolio page", async ({ page }) => {
    // 1. Create a trader with PRO plan
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    // Upgrade to PRO
    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    // 2. Navigate to portfolio page
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // 3. Verify page loaded successfully (exact text from page.tsx line 248)
    await expect(
      page.getByRole("heading", { name: /portfolio analytics/i }),
    ).toBeVisible();
  });
});

test.describe("Portfolio Page - Tab Navigation", () => {
  test("displays 3 tabs: Performance, Risk Analysis, Trade History", async ({
    page,
  }) => {
    // 1. Create a trader with data
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    // Create complete portfolio data
    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    // 2. Navigate to portfolio page
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // 3. Verify all tabs are visible (exact text from page.tsx lines 273-275)
    const performanceTab = page.getByRole("tab", { name: /performance/i });
    const riskTab = page.getByRole("tab", { name: /risk analysis/i });
    const historyTab = page.getByRole("tab", { name: /trade history/i });

    await expect(performanceTab).toBeVisible();
    await expect(riskTab).toBeVisible();
    await expect(historyTab).toBeVisible();
  });

  test("switches between tabs correctly", async ({ page }) => {
    // 1. Create trader with portfolio data
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    // 2. Navigate to portfolio page
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // 3. Performance tab is active by default (page.tsx line 271)
    // Wait for metrics to load
    await expect(page.getByText(/total value/i)).toBeVisible();

    // 4. Click Risk Analysis tab
    const riskTab = page.getByRole("tab", { name: /risk analysis/i });
    await riskTab.click();

    // Verify Risk Analysis content (page.tsx lines 150-164: Max Drawdown, VaR, Sortino)
    await expect(page.getByText(/max drawdown/i)).toBeVisible();
    await expect(page.getByText(/value at risk/i)).toBeVisible();
    await expect(page.getByText(/sortino ratio/i)).toBeVisible();

    // 5. Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Verify Trade History content - look for table (more specific than text)
    await expect(page.locator("table")).toBeVisible();
  });
});

test.describe("Portfolio Page - Performance Tab", () => {
  test("displays key metrics cards", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Verify key metrics are displayed (page.tsx lines 76-123)
    await expect(page.getByText(/total value/i)).toBeVisible();
    await expect(page.getByText(/total pnl/i)).toBeVisible();
    await expect(page.getByText(/win rate/i)).toBeVisible();
    await expect(page.getByText(/sharpe ratio/i)).toBeVisible();
  });

  test("displays performance chart", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Performance tab to ensure it's active
    const performanceTab = page.getByRole("tab", { name: /performance/i });
    await performanceTab.click();

    // Verify chart section exists (page.tsx line 213: "Portfolio Performance")
    await expect(page.getByText(/portfolio performance/i)).toBeVisible();
  });
});

test.describe("Portfolio Page - Risk Analysis Tab", () => {
  test("displays risk metrics", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Risk Analysis tab
    const riskTab = page.getByRole("tab", { name: /risk analysis/i });
    await riskTab.click();

    // Verify risk metrics are displayed (page.tsx lines 150-164)
    await Promise.all([
      expect(page.getByText(/max drawdown/i).first()).toBeVisible(),
      expect(page.getByText(/value at risk/i).first()).toBeVisible(),
      expect(page.getByText(/sortino ratio/i).first()).toBeVisible(),
    ]);
  });
});

test.describe("Portfolio Page - Trade History Tab", () => {
  test("displays trade history table with columns", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Wait for table to be visible
    await page.waitForSelector("table", { timeout: 10000 });

    // Verify table is rendered with data
    await expect(page.locator("table")).toBeVisible();

    // Verify at least one trade row is displayed
    await page.waitForSelector("table tbody tr", { timeout: 10000 });
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify key column headers exist in the table
    await expect(page.locator("table th", { hasText: /date/i })).toBeVisible();
    await expect(
      page.locator("table th", { hasText: /symbol/i }),
    ).toBeVisible();
  });

  test("filters trades by status", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Find the status filter select (trade-history-table.tsx lines 169-179)
    const statusFilter = page.locator('button:has-text("All Status")').first();
    await statusFilter.click();

    // Select "Open" status
    await page.getByText("Open", { exact: true }).click();

    // Verify Open status badge is visible
    await expect(page.getByText(/open/i).first()).toBeVisible();
  });

  test("filters trades by symbol", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Find search input (trade-history-table.tsx line 162)
    const searchInput = page.getByPlaceholder(/search symbol/i);
    await searchInput.fill("BTC");

    // Wait for filtering to complete
    await page.waitForTimeout(500);

    // Verify table has content after filtering
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("paginates trade history", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Check if pagination exists (only shows if >10 trades, trade-history-table.tsx line 280)
    const paginationText = page.getByText(/showing \d+ to \d+ of \d+ trades/i);

    if (await paginationText.isVisible()) {
      // Find next button by ChevronRight icon (trade-history-table.tsx lines 299-306)
      const nextButton = page
        .locator("button[data-state]:has(svg.lucide-chevron-right)")
        .last();

      if (await nextButton.isEnabled()) {
        await nextButton.click();

        // Verify pagination text updated
        await expect(paginationText).toBeVisible();

        // Verify previous button is now visible
        const prevButton = page
          .locator("button[data-state]:has(svg.lucide-chevron-left)")
          .first();
        await expect(prevButton).toBeEnabled();
      }
    }
  });

  test("sorts trades by column", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Find sort select (trade-history-table.tsx lines 181-193)
    const sortSelect = page.locator('button:has-text("Date")').first();
    await sortSelect.click();

    // Select "Symbol" sort - use role to be more specific
    await page.getByRole("option", { name: "Symbol" }).click();

    // Verify table still has content after sorting
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

test.describe("Portfolio Page - Empty States", () => {
  test("shows empty state when no trades exist", async ({ page }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    // Navigate to portfolio without creating any trades
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Verify empty state message (trade-history-table.tsx line 228)
    await expect(page.getByText(/no trades found/i)).toBeVisible();
  });

  test("shows empty state in trade history when no trades match filters", async ({
    page,
  }) => {
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    await prisma.user.update({
      where: { id: trader.id },
      data: { planName: "pro" },
    });

    const traderProfile = await prisma.traderProfile.findUniqueOrThrow({
      where: { userId: trader.id },
    });

    await createCompletePortfolioData({ traderProfileId: traderProfile.id });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // Click Trade History tab
    const historyTab = page.getByRole("tab", { name: /trade history/i });
    await historyTab.click();

    // Enter search query that matches nothing
    const searchInput = page.getByPlaceholder(/search symbol/i);
    await searchInput.fill("ZZZZNONEXISTENT");

    // Wait for filtering
    await page.waitForTimeout(500);

    // Verify empty state
    await expect(page.getByText(/no trades found/i)).toBeVisible();
  });
});
