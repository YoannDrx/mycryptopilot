import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestTrader } from "./utils/trader-test";

test.describe("Trader Referral System", () => {
  test("complete referral flow - share link and follow", async ({ page }) => {
    // 1. Create a trader
    const { user: trader, traderProfile } = await createTestTrader({ page });

    // Navigate to trader dashboard
    await page.goto("/orgs");
    await page.waitForURL(/\/orgs\/.*/);

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1].split("/")[0];

    await page.goto(`/orgs/${orgSlug}/dashboard/trader`);
    await page.waitForLoadState("networkidle");

    // 2. Get referral link
    // Should see referral link card
    await expect(page.getByText(/your referral link/i)).toBeVisible();

    // Get the referral URL from the input field
    const referralInput = page.locator('input[readonly][value*="/follow/"]');
    const referralUrl = await referralInput.inputValue();
    expect(referralUrl).toContain(`/follow/${trader.id}`);

    // 3. Test copy button functionality
    await page.getByRole("button", { name: /copy/i }).first().click();

    // Should show success message
    await page.waitForSelector("text=Link copied to clipboard", {
      timeout: 5000,
    });

    // 4. Sign out trader
    await signOutAccount({ page });

    // 5. Create a follower account
    const followerEmail = `follower-${Date.now()}@test.com`;
    await createTestAccount({
      page,
      callbackURL: "/orgs",
      initialUserData: {
        name: "Test Follower",
        email: followerEmail,
        password: "TestPassword123!",
      },
    });

    await page.waitForURL(/\/orgs\/.*/);

    // 6. Navigate to referral link
    await page.goto(referralUrl);
    await page.waitForLoadState("networkidle");

    // Should see trader profile preview
    await expect(page.getByText(traderProfile.displayName)).toBeVisible();
    await expect(page.getByRole("button", { name: /follow/i })).toBeVisible();

    // 7. Click follow button
    await page.getByRole("button", { name: /follow/i }).click();

    // Should redirect to dashboard after follow
    await page.waitForURL(/\/orgs\/.*\/dashboard/, { timeout: 10000 });

    // 8. Verify follow relationship exists
    const follower = await prisma.user.findUnique({
      where: { email: followerEmail },
    });

    expect(follower).not.toBeNull();

    if (!follower) {
      throw new Error("Follower not found");
    }

    const follow = await prisma.follow.findFirst({
      where: {
        traderId: trader.id,
        userId: follower.id,
      },
    });

    expect(follow).not.toBeNull();
    expect(follow?.status).toBe("ACTIVE");

    // Cleanup
    await prisma.user.delete({ where: { id: trader.id } });
    await prisma.user.delete({ where: { id: follower.id } });
  });

  test("already following trader redirects to dashboard", async ({ page }) => {
    // 1. Create trader
    const { user: trader } = await createTestTrader({ page });

    // 2. Sign out and create follower
    await signOutAccount({ page });

    const followerEmail = `follower-${Date.now()}@test.com`;
    await createTestAccount({
      page,
      callbackURL: "/orgs",
      initialUserData: {
        name: "Test Follower",
        email: followerEmail,
        password: "TestPassword123!",
      },
    });

    await page.waitForURL(/\/orgs\/.*/);

    const follower = await prisma.user.findUniqueOrThrow({
      where: { email: followerEmail },
    });

    // 3. Create follow relationship
    await prisma.follow.create({
      data: {
        userId: follower.id,
        traderId: trader.id,
        status: "ACTIVE",
      },
    });

    // 4. Navigate to referral link
    const referralUrl = `http://localhost:3000/follow/${trader.id}`;
    await page.goto(referralUrl);

    // Should redirect to dashboard with query param
    await page.waitForURL(/\/orgs\/.*\/dashboard.*already_following/, {
      timeout: 10000,
    });

    const currentUrl = page.url();
    expect(currentUrl).toContain("already_following");
    expect(currentUrl).toContain(trader.id);

    // Cleanup
    await prisma.user.delete({ where: { id: trader.id } });
    await prisma.user.delete({ where: { id: follower.id } });
  });

  test("non-authenticated user redirects to signin", async ({ page }) => {
    // Create trader
    const { user: trader } = await createTestTrader({ page });

    // Sign out
    await signOutAccount({ page });

    // Navigate to referral link without being logged in
    const referralUrl = `http://localhost:3000/follow/${trader.id}`;
    await page.goto(referralUrl);

    // Should redirect to signin with callback
    await page.waitForURL(/\/auth\/signin.*callbackUrl/, { timeout: 10000 });

    const currentUrl = page.url();
    expect(currentUrl).toContain("/auth/signin");
    expect(currentUrl).toContain("callbackUrl");
    expect(currentUrl).toContain(encodeURIComponent(`/follow/${trader.id}`));

    // Cleanup
    await prisma.user.delete({ where: { id: trader.id } });
  });

  test("referral link shows trader stats correctly", async ({ page }) => {
    // Create trader with specific stats
    const { user: trader } = await createTestTrader({ page });

    // Update trader stats
    await prisma.traderProfile.update({
      where: { userId: trader.id },
      data: {
        statsJson: {
          winrate: 75.5,
          payoff: 2.3,
          totalTrades: 150,
        },
      },
    });

    // Create some signals for the trader
    const { createTestSignal } = await import("./utils/trader-test");
    await createTestSignal({ traderId: trader.id });
    await createTestSignal({ traderId: trader.id });

    // Sign out
    await signOutAccount({ page });

    // Create follower
    const followerEmail = `follower-${Date.now()}@test.com`;
    await createTestAccount({
      page,
      callbackURL: "/orgs",
      initialUserData: {
        name: "Test Follower",
        email: followerEmail,
        password: "TestPassword123!",
      },
    });

    // Navigate to referral link
    const referralUrl = `http://localhost:3000/follow/${trader.id}`;
    await page.goto(referralUrl);
    await page.waitForLoadState("networkidle");

    // Should see trader stats
    await expect(page.getByText("75.5%")).toBeVisible(); // Win rate
    await expect(page.getByText("2.3", { exact: true })).toBeVisible(); // Payoff
    await expect(page.getByText("2", { exact: true })).toBeVisible(); // Signals count

    // Cleanup
    const follower = await prisma.user.findUnique({
      where: { email: followerEmail },
    });

    await prisma.user.delete({ where: { id: trader.id } });
    if (follower) {
      await prisma.user.delete({ where: { id: follower.id } });
    }
  });
});
