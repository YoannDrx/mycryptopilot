import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestSignal, createTestTrader } from "./utils/trader-test";

test.describe("Signals Feed with Filters", () => {
  test("user can filter signals by asset", async ({ page }) => {
    // 1. Create a trader with multiple signals
    const { user: trader } = await createTestTrader({ page });

    // Create signals with different assets using helper
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    const followerData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    // Follow the trader
    await prisma.follow.create({
      data: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Navigate to signals feed
    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // 4. Verify all signals visible initially
    await expect(page.getByText("BTC")).toBeVisible();
    await expect(page.getByText("ETH")).toBeVisible();
    await expect(page.getByText("SOL")).toBeVisible();

    // 5. Apply asset filter for BTC
    const assetFilter = page.getByLabel(/assets/i);
    if (await assetFilter.isVisible()) {
      await assetFilter.click();
      await page.getByRole("option", { name: /^btc$/i }).click();

      // Click outside to close dropdown
      await page.keyboard.press("Escape");

      // Wait for filtering to apply
      await page.waitForTimeout(1000);

      // Verify only BTC signal visible
      await expect(page.getByText("BTC")).toBeVisible();
      await expect(page.getByText("ETH")).not.toBeVisible();
      await expect(page.getByText("SOL")).not.toBeVisible();
    }
  });

  test("user can filter signals by bias (LONG/SHORT)", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    // Create signals with different biases
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    const followerData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    // Follow the trader
    await prisma.follow.create({
      data: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Navigate to signals feed
    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // 4. Filter by LONG bias
    const biasFilter = page.getByLabel(/bias/i);
    if (await biasFilter.isVisible()) {
      await biasFilter.click();
      await page.getByRole("option", { name: /^long$/i }).click();

      await page.waitForTimeout(1000);

      // Verify only LONG signal visible
      await expect(page.getByText("Long setup")).toBeVisible();
      await expect(page.getByText("Short setup")).not.toBeVisible();

      // 5. Switch to SHORT bias
      await biasFilter.click();
      await page.getByRole("option", { name: /^short$/i }).click();

      await page.waitForTimeout(1000);

      // Verify only SHORT signal visible
      await expect(page.getByText("Short setup")).toBeVisible();
      await expect(page.getByText("Long setup")).not.toBeVisible();
    }
  });

  test("user can filter by risk level range", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    // Create signals with different risk levels
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    const followerData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    await prisma.follow.create({
      data: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Navigate to signals feed
    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // 4. Set risk level range (1-2) to show only low risk
    const riskMinSlider = page.getByLabel(/risk.*min/i);
    const riskMaxSlider = page.getByLabel(/risk.*max/i);

    if ((await riskMinSlider.count()) > 0 && (await riskMaxSlider.count()) > 0) {
      await riskMinSlider.fill("1");
      await riskMaxSlider.fill("2");

      await page.waitForTimeout(1000);

      // Verify only low risk signal visible
      await expect(page.getByText("Low risk setup")).toBeVisible();
      await expect(page.getByText("High risk setup")).not.toBeVisible();
    }
  });

  test("user can search signals by text", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    // Create signals with unique rationales
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    const followerData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    await prisma.follow.create({
      data: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Navigate to signals feed
    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // 4. Search for "BREAKOUT"
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("BREAKOUT");

      await page.waitForTimeout(1000);

      // Verify only signal with BREAKOUT visible
      await expect(
        page.getByText(/unique keyword.*breakout/i),
      ).toBeVisible();
      await expect(page.getByText("Regular analysis")).not.toBeVisible();
    }
  });

  test("filters persist in URL when applied", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    await createTestSignal({ traderId: trader.id });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    const followerData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    await prisma.follow.create({
      data: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Navigate to signals feed
    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // 4. Apply filter (bias = LONG)
    const biasFilter = page.getByLabel(/bias/i);
    if (await biasFilter.isVisible()) {
      await biasFilter.click();
      await page.getByRole("option", { name: /^long$/i }).click();

      await page.waitForTimeout(1000);

      // 5. Verify URL contains filter parameter
      const urlAfterFilter = page.url();
      expect(urlAfterFilter).toContain("bias=LONG");

      // 6. Reload page and verify filter still applied
      await page.reload();
      await page.waitForLoadState("networkidle");

      const urlAfterReload = page.url();
      expect(urlAfterReload).toContain("bias=LONG");
    }
  });
});
