import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestSignal, createTestTrader } from "./utils/trader-test";

test.describe("Follow/Unfollow Trader Flow", () => {
  test("user can follow and unfollow a trader", async ({ page }) => {
    // 1. Create a trader with signals
    const { user: trader, traderProfile } = await createTestTrader({ page });

    // Create a few signals for the trader
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // 2. Sign out trader and create a follower account
    await signOutAccount({ page });

    const followerData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    // Get follower from database
    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    // Extract org slug
    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];
    expect(orgSlug).toBeTruthy();

    // 3. Navigate to traders marketplace
    await page.goto(`/orgs/${orgSlug}/traders`);
    await page.waitForLoadState("networkidle");

    // 4. Find the trader in the list and click on their profile
    await page.getByText(traderProfile.displayName).first().click();

    // Wait for trader profile page to load
    await page.waitForURL(/\/traders\/.+/, { timeout: 10000 });

    // 5. Click Follow button
    const followButton = page.getByRole("button", { name: /follow/i });
    await expect(followButton).toBeVisible({ timeout: 5000 });
    await followButton.click();

    // Wait for success message
    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });

    // 6. Verify follow relationship in database
    const followRelation = await prisma.follow.findFirst({
      where: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    expect(followRelation).not.toBeNull();
    expect(followRelation?.userId).toBe(follower.id);
    expect(followRelation?.traderId).toBe(trader.id);

    // 7. Verify button changed to "Unfollow"
    const unfollowButton = page.getByRole("button", { name: /unfollow/i });
    await expect(unfollowButton).toBeVisible({ timeout: 5000 });

    // 8. Navigate to following page to verify trader appears there
    await page.goto(`/orgs/${orgSlug}/account/following`);
    await page.waitForLoadState("networkidle");

    // Verify trader appears in following list
    await expect(page.getByText(traderProfile.displayName)).toBeVisible();

    // 9. Click Unfollow
    await page.goto(`/orgs/${orgSlug}/traders/${trader.id}`);
    await page.waitForLoadState("networkidle");

    const unfollowBtn = page.getByRole("button", { name: /unfollow/i });
    await unfollowBtn.click();

    // Wait for success message
    await expect(
      page.getByText(/successfully unfollowed|no longer following/i),
    ).toBeVisible({ timeout: 10000 });

    // 10. Verify follow relationship removed from database
    const followRelationAfterUnfollow = await prisma.follow.findFirst({
      where: {
        userId: follower.id,
        traderId: trader.id,
      },
    });

    expect(followRelationAfterUnfollow).toBeNull();

    // 11. Verify button changed back to "Follow"
    await expect(
      page.getByRole("button", { name: /^follow$/i }),
    ).toBeVisible();
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
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerData.email },
    });

    // Verify user is on Free plan
    expect(follower.planName).toBe("free");

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Follow first trader (should succeed)
    await page.goto(`/orgs/${orgSlug}/traders/${trader1.id}`);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /follow/i }).click();
    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });

    // 4. Try to follow second trader (should fail with plan limit message)
    await page.goto(`/orgs/${orgSlug}/traders/${trader2.id}`);
    await page.waitForLoadState("networkidle");

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

    // Create signals
    const signal1 = await createTestSignal({ traderId: trader.id });
    const signal2 = await createTestSignal({ traderId: trader.id });

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

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 3. Follow the trader
    await page.goto(`/orgs/${orgSlug}/traders/${trader.id}`);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /follow/i }).click();
    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });

    // 4. Navigate to user dashboard
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // 5. Verify signals from followed trader appear
    await expect(page.getByText(signal1.symbol)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(signal2.symbol)).toBeVisible({ timeout: 5000 });

    // 6. Verify trader's name appears
    await expect(page.getByText(traderProfile.displayName)).toBeVisible();
  });
});
