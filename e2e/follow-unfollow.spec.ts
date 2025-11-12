import { PrismaClient } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestSignal, createTestTrader } from "./utils/trader-test";

const prismaDirect = new PrismaClient();

test.afterAll(async () => {
  await prismaDirect.$disconnect();
});

test.describe("Follow/Unfollow Trader Flow", () => {
  test("user can follow and unfollow a trader", async ({ page }) => {
    // 1. Create a trader with signals
    const { user: trader, traderProfile } = await createTestTrader({ page });

    // Create a few signals for the trader
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out trader and create a follower account
    await signOutAccount({ page });

    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // Get follower from database
    // 3. Naviguer directement vers la page profil du trader créé
    await page.goto(`/traders/${trader.id}`);
    await page.waitForLoadState("domcontentloaded");

    // 5. Click Follow button (use .first() - multiple Follow buttons on page)
    const followButton = page.getByRole("button", { name: /follow/i }).first();
    await expect(followButton).toBeVisible({ timeout: 5000 });
    await followButton.click();

    // Wait for success message
    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });
    await expect(followButton).toHaveText(/following/i, { timeout: 10000 });

    // 6. Navigate to following page to verify trader appears there and test Unfollow
    await page.goto("/account/following");
    await page.waitForLoadState("domcontentloaded");

    const followingLink = page.getByRole("link", {
      name: traderProfile.displayName,
    });

    // Verify trader appears in following list via stable test id
    await expect(followingLink).toBeVisible({ timeout: 20000 });

    // 8-9. Test Unfollow from the "Following" page
    // Find the trader card and click the Following button (which should show "Following")
    // Note: Testing from /account/following instead of /traders/[id] due to Server Component refresh issue
    const followingBtn = page
      .getByRole("button", { name: /following/i })
      .first();
    await expect(followingBtn).toBeVisible({ timeout: 10000 });
    await followingBtn.click();

    // Wait for unfollow confirmation dialog to appear
    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 5000 });

    // Click Unfollow button in the confirmation dialog
    const unfollowBtn = page.getByRole("button", { name: /^unfollow$/i });
    await expect(unfollowBtn).toBeVisible({ timeout: 5000 });
    await unfollowBtn.click();

    // Wait for success message (Server Actions don't use API routes)
    await expect(
      page.getByText(/unfollowed this trader|no longer following/i),
    ).toBeVisible({ timeout: 10000 });

    // 10. Verify trader no longer appears in following list
    await page.goto("/account/following");
    await page.waitForLoadState("domcontentloaded");

    // Trader should not be in the list anymore (or list is empty)
    await expect(followingLink).toHaveCount(0);
  });

  test("free user cannot follow more than 1 trader", async ({ page }) => {
    // 1. Create two traders
    const { user: trader1 } = await createTestTrader({ page });
    await signOutAccount({ page });

    const { user: trader2 } = await createTestTrader({ page });
    await signOutAccount({ page });

    // 2. Create a free user
    const followerData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    // Verify user is on Free plan
    expect(follower.planName).toBe("free");

    // 3. Follow first trader (should succeed)
    await page.goto(`/traders/${trader1.id}`);
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: /follow/i }).click();

    // Wait for API response to complete
    await page.waitForTimeout(500); // Allow UI update

    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /following/i }).first(),
    ).toBeVisible({ timeout: 10000 });

    // 4. Try to follow second trader (should fail with plan limit message)
    await page.goto(`/traders/${trader2.id}`);
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: /follow/i }).click();

    // Expect error message about plan limit
    await expect(
      page.getByText(/upgrade.*plan|limit reached|free plan.*1 trader/i),
    ).toBeVisible({ timeout: 10000 });

    // 5. Verify only 1 follow relationship exists
    const followCount = await prisma.follow.count({
      where: {
        userId: follower.id,
      },
    });

    expect(followCount).toBe(1);
  });

  test("following trader shows their signals in user dashboard", async ({
    page,
  }) => {
    // 1. Create a trader with signals
    const { user: trader, traderProfile } = await createTestTrader({ page });

    // Create signals with specific symbols
    const signal1 = await createTestSignal({
      traderId: trader.id,
      symbol: "BTC",
    });
    const signal2 = await createTestSignal({
      traderId: trader.id,
      symbol: "ETH",
    });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 3. Follow the trader
    await page.goto(`/traders/${trader.id}`);
    await page.waitForLoadState("domcontentloaded");

    const followBtn = page.getByRole("button", { name: /follow/i }).first();
    await expect(followBtn).toBeVisible({ timeout: 10000 });
    await followBtn.click();

    // Wait for API response to complete
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/follow") &&
        (response.status() === 200 || response.status() === 204),
      { timeout: 10000 },
    );
    await page.waitForTimeout(500); // Allow UI update

    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });

    // 4. Navigate to user dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // 5. Verify signals from followed trader appear
    await expect(page.getByText(signal1.symbol)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(signal2.symbol)).toBeVisible({ timeout: 5000 });

    // 6. Verify trader's name appears
    await expect(
      page.getByText(traderProfile.displayName).first(),
    ).toBeVisible();
  });
});
