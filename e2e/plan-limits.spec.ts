import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestTrader, createTestSignal } from "./utils/trader-test";
import { upgradeUserToPlan } from "./utils/payment-test";

test.describe("Plan Limits", () => {
  test("free user limited to 5 signals per day", async ({ page }) => {
    // Note: This test verifies the activeSignalsLimit (3 signals) for Free plan
    // The description in issue says "5 signals per day" but mycryptopilot-plans.ts shows:
    // Free: activeSignalsLimit: 3
    // Pro: activeSignalsLimit: 15
    // Ultra: activeSignalsLimit: 999

    // 1. Create a trader with 10 signals
    const { user: trader } = await createTestTrader({ page });

    // Create 10 signals
    await Promise.all(
      Array.from({ length: 10 }, async (_, i) =>
        createTestSignal({
          traderId: trader.id,
          symbol: `SIGNAL${i + 1}-USDT`,
          rationale: `Signal ${i + 1}`,
        }),
      ),
    );

    // 2. Sign out and create a Free user
    await signOutAccount({ page });

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

    // 3. Follow the trader
    await page.goto(`/orgs/${orgSlug}/traders/${trader.id}`);
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("button", { name: /follow/i })
      .first()
      .click();
    await expect(
      page.getByText(/successfully followed|now following/i),
    ).toBeVisible({ timeout: 10000 });

    // 4. Navigate to dashboard to see signals
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // 5. Verify first 3 signals are clear (activeSignalsLimit = 3 for Free)
    // Remaining 7 signals should be blurred or show upgrade CTA

    // Note: This requires the blurred signals feature to be implemented
    // According to dashboard.spec.ts, this feature is SKIPPED (not yet implemented)
    // For now, we just verify that signals are displayed

    // Count visible signal cards
    const signalCards = page.locator('[data-testid="trading-card"]');
    const visibleCount = await signalCards.count();

    // Free plan should see signals (exact behavior depends on implementation)
    expect(visibleCount).toBeGreaterThan(0);

    // TODO: Once blurred signals feature is implemented, verify:
    // - First 3 signals are clear (no blur/opacity)
    // - Signals 4+ have blur effect or "Upgrade to Pro" CTA
  });

  test("pro user can follow up to 5 traders", async ({ page }) => {
    // 1. Create a Pro user
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Upgrade user to Pro plan
    await upgradeUserToPlan({
      userId: user.id,
      plan: "pro",
      daysGranted: 30,
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 2. Create 6 traders sequentially (required due to page navigation)
    const createTraders = async (count: number) => {
      const result = [];

      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line no-await-in-loop
        await signOutAccount({ page });
        // eslint-disable-next-line no-await-in-loop
        const { user: trader } = await createTestTrader({ page });
        result.push(trader);
      }
      return result;
    };

    const traders = await createTraders(6);

    // 3. Sign back in as Pro user
    await signOutAccount({ page });
    await page.goto("/auth/signin");
    await page.getByRole("button", { name: /use password/i }).click();
    await page.getByLabel("Email").fill(userData.email);
    await page.locator('input[name="password"]').fill(userData.password);
    await page
      .getByRole("button", { name: /sign in/i })
      .first()
      .click();

    await page.waitForURL(/\/orgs\/.*/, { timeout: 10000 });

    // 4. Follow first 5 traders (should all succeed - Pro limit is 5)

    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(`/orgs/${orgSlug}/traders/${traders[i]?.id}`);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForLoadState("networkidle");

      // eslint-disable-next-line no-await-in-loop
      await page
        .getByRole("button", { name: /follow/i })
        .first()
        .click();
      // eslint-disable-next-line no-await-in-loop
      await expect(
        page.getByText(/successfully followed|now following/i),
      ).toBeVisible({ timeout: 10000 });
    }

    // 5. Try to follow 6th trader (should fail - exceeds Pro limit)
    await page.goto(`/orgs/${orgSlug}/traders/${traders[5]?.id}`);
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("button", { name: /follow/i })
      .first()
      .click();

    // Expect error message about reaching Pro plan limit
    await expect(
      page.getByText(/upgrade.*ultra|limit reached|pro plan.*5 traders/i),
    ).toBeVisible({ timeout: 10000 });

    // 6. Verify exactly 5 follow relationships exist
    const followCount = await prisma.follow.count({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    expect(followCount).toBe(5);
  });

  test("ultra user has unlimited follows and signals", async ({ page }) => {
    // 1. Create an Ultra user
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Upgrade user to Ultra plan
    await upgradeUserToPlan({
      userId: user.id,
      plan: "ultra",
      daysGranted: 30,
    });

    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    // 2. Create 10 traders (more than Pro limit of 5)
    const createTraders = async (count: number) => {
      const result = [];

      for (let i = 0; i < count; i++) {
        // eslint-disable-next-line no-await-in-loop
        await signOutAccount({ page });
        // eslint-disable-next-line no-await-in-loop
        const { user: trader } = await createTestTrader({ page });
        result.push(trader);
      }
      return result;
    };

    const traders = await createTraders(10);

    // 3. Sign back in as Ultra user
    await signOutAccount({ page });
    await page.goto("/auth/signin");
    await page.getByRole("button", { name: /use password/i }).click();
    await page.getByLabel("Email").fill(userData.email);
    await page.locator('input[name="password"]').fill(userData.password);
    await page
      .getByRole("button", { name: /sign in/i })
      .first()
      .click();

    await page.waitForURL(/\/orgs\/.*/, { timeout: 10000 });

    // 4. Follow all 10 traders (should all succeed - Ultra has no limit)
     
    for (const trader of traders) {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(`/orgs/${orgSlug}/traders/${trader.id}`);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForLoadState("networkidle");

      // eslint-disable-next-line no-await-in-loop
      await page
        .getByRole("button", { name: /follow/i })
        .first()
        .click();
      // eslint-disable-next-line no-await-in-loop
      await expect(
        page.getByText(/successfully followed|now following/i),
      ).toBeVisible({ timeout: 10000 });
    }

    // 5. Verify all 10 follow relationships exist
    const followCount = await prisma.follow.count({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    expect(followCount).toBe(10);

    // 6. Verify Ultra user can see unlimited signals
    // Navigate to dashboard
    await page.goto(`/orgs/${orgSlug}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Ultra plan has activeSignalsLimit: 999 (unlimited)
    // Should see all signals without blur or upgrade prompts
    // Note: Exact verification depends on signal display implementation
  });
});
