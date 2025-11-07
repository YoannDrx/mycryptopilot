import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestTrader, createTestSignal } from "./utils/trader-test";

test.describe("Trader Dashboard", () => {
  test("trader dashboard shows published signals", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    // 2. Publish 5 signals
    await Promise.all([
      createTestSignal({
        traderId: trader.id,
        symbol: "BTC-USDT",
        rationale: "Signal 1",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "ETH-USDT",
        rationale: "Signal 2",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "SOL-USDT",
        rationale: "Signal 3",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "AVAX-USDT",
        rationale: "Signal 4",
      }),
      createTestSignal({
        traderId: trader.id,
        symbol: "MATIC-USDT",
        rationale: "Signal 5",
      }),
    ]);

    // 3. Navigate to trader dashboard
    await page.goto("/dashboard/trader");
    await page.waitForLoadState("networkidle");

    // 4. Verify "My Signals" tab is active by default
    const mySignalsTab = page.getByRole("tab", { name: /my signals/i });
    await expect(mySignalsTab).toBeVisible();
    await expect(mySignalsTab).toHaveAttribute("data-state", "active");

    // 5. Verify all 5 signals are displayed
    await expect(page.getByText("BTC-USDT").first()).toBeVisible();
    await expect(page.getByText("ETH-USDT").first()).toBeVisible();
    await expect(page.getByText("SOL-USDT").first()).toBeVisible();
    await expect(page.getByText("AVAX-USDT").first()).toBeVisible();
    await expect(page.getByText("MATIC-USDT").first()).toBeVisible();

    // 6. Verify Active Signals stat card shows 5
    await expect(
      page.getByText("Active Signals").locator("..").locator("..").first(),
    ).toContainText("5");
  });

  test("trader dashboard shows followers count", async ({ page }) => {
    // 1. Create a trader
    const { user: trader } = await createTestTrader({ page });

    await page.waitForURL(/\/dashboard$/);

    // 2. Create 3 followers manually in database
    // Note: We create followers directly in DB rather than creating full accounts
    // because we only need to verify the count displayed in the dashboard
    const { randomUUID } = await import("crypto");
    const now = new Date();

    const follower1 = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `follower1-${Date.now()}@test.com`,
        name: "Follower 1",
        emailVerified: false,
        planName: "free",
        createdAt: now,
        updatedAt: now,
      },
    });

    const follower2 = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `follower2-${Date.now()}@test.com`,
        name: "Follower 2",
        emailVerified: false,
        planName: "free",
        createdAt: now,
        updatedAt: now,
      },
    });

    const follower3 = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `follower3-${Date.now()}@test.com`,
        name: "Follower 3",
        emailVerified: false,
        planName: "free",
        createdAt: now,
        updatedAt: now,
      },
    });

    // 3. Create follow relationships
    await prisma.follow.createMany({
      data: [
        {
          userId: follower1.id,
          traderId: trader.id,
          status: "ACTIVE",
        },
        {
          userId: follower2.id,
          traderId: trader.id,
          status: "ACTIVE",
        },
        {
          userId: follower3.id,
          traderId: trader.id,
          status: "ACTIVE",
        },
      ],
    });

    // 4. Navigate to trader dashboard
    await page.goto("/dashboard/trader");
    await page.waitForLoadState("networkidle");

    // 5. Verify Followers stat card shows 3
    const followersCard = page
      .getByText("Followers")
      .locator("..")
      .locator("..")
      .first();
    await expect(followersCard).toContainText("3");

    // 6. Verify text shows "Growing your audience" instead of "No followers yet"
    await expect(followersCard).toContainText(/growing your audience/i);
  });
});
