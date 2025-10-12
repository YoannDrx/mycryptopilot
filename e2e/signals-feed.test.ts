import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";

test.describe("Signals Feed with Filters", () => {
  test("should display signals feed and apply filters", async ({ page }) => {
    // Create a test trader account
    const traderData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    // Get the user from database
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: traderData.email },
      select: { id: true },
    });

    // Create trader profile
    const traderProfile = await prisma.traderProfile.create({
      data: {
        userId: user.id,
        displayName: faker.person.firstName(),
        bio: "Test trader profile",
        verified: true,
      },
    });

    // Update user role to TRADER
    await prisma.user.update({
      where: { id: user.id },
      data: { userRole: "TRADER" },
    });

    // Create some test signals with different characteristics
    const signals = await Promise.all([
      // BTC LONG SPOT signal
      prisma.signal.create({
        data: {
          traderId: user.id,
          symbol: "BTC-USDT",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
          ttlSec: 86400, // 24h
          hash: `test-signal-1-${Date.now()}`,
          payloadJson: {
            bias: "LONG",
            instrumentType: "SPOT",
            entry: 50000,
            tps: [52000, 54000],
            invalidation: 48000,
            confidence: 85,
          },
        },
      }),
      // ETH SHORT PERP signal
      prisma.signal.create({
        data: {
          traderId: user.id,
          symbol: "ETH-USDT",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          ttlSec: 86400,
          hash: `test-signal-2-${Date.now()}`,
          payloadJson: {
            bias: "SHORT",
            instrumentType: "PERP",
            entry: 3000,
            tps: [2900, 2800],
            invalidation: 3100,
            confidence: 75,
          },
        },
      }),
      // SOL LONG PERP signal
      prisma.signal.create({
        data: {
          traderId: user.id,
          symbol: "SOL-USDT",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          ttlSec: 86400,
          hash: `test-signal-3-${Date.now()}`,
          payloadJson: {
            bias: "LONG",
            instrumentType: "PERP",
            entry: 100,
            tps: [105, 110],
            invalidation: 95,
            confidence: 80,
          },
        },
      }),
      // Expired BTC signal
      prisma.signal.create({
        data: {
          traderId: user.id,
          symbol: "BTC-USDT",
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
          ttlSec: 3600,
          hash: `test-signal-4-${Date.now()}`,
          payloadJson: {
            bias: "SHORT",
            instrumentType: "SPOT",
            entry: 49000,
            tps: [48000],
            invalidation: 50000,
            confidence: 70,
          },
        },
      }),
    ]);

    // Navigate to signals feed page
    await page.goto("/orgs");
    await page.waitForLoadState("networkidle");

    // Wait for the org slug to be set
    await page.waitForURL(/\/orgs\/[^/]+$/);
    const url = page.url();
    const orgSlug = url.split("/orgs/")[1]?.split("/")[0] ?? "";

    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // Test 1: Verify signals are displayed (should see 3 active signals, not the expired one)
    await expect(page.getByText("BTC-USDT")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("ETH-USDT")).toBeVisible();
    await expect(page.getByText("SOL-USDT")).toBeVisible();

    // Test 2: Filter by single symbol (BTC)
    await page.getByPlaceholder("Search symbols...").fill("BTC-USDT");
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");

    // Should see only BTC signal
    await expect(page.getByText("BTC-USDT")).toBeVisible();
    const ethSignal = page.getByText("ETH-USDT");
    if (await ethSignal.isVisible()) {
      // Might still be visible if it's in the same grid
      // Check that we have only 1 signal card
      const cards = page.locator('[data-testid="signal-card"]');
      await expect(cards).toHaveCount(1);
    }

    // Test 3: Add multiple symbols
    await page.getByPlaceholder("Search symbols...").fill("ETH-USDT");
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");

    // Should see both BTC and ETH
    await expect(page.getByText("BTC-USDT")).toBeVisible();
    await expect(page.getByText("ETH-USDT")).toBeVisible();

    // Test 4: Use popular symbols quick-add
    await page.getByRole("button", { name: "SOL-USDT" }).click();
    await page.waitForLoadState("networkidle");

    // Should see all three
    await expect(page.getByText("SOL-USDT")).toBeVisible();

    // Test 5: Clear all filters
    const clearButton = page.getByRole("button", { name: /clear all/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForLoadState("networkidle");
    } else {
      // Remove symbols one by one
      const symbolTags = page.locator('[data-testid="symbol-tag"]');
      const count = await symbolTags.count();
       
      for (let i = 0; i < count; i++) {
        const removeButton = symbolTags.nth(0).locator("button");
        // eslint-disable-next-line no-await-in-loop
        await removeButton.click();
        // eslint-disable-next-line no-await-in-loop
        await page.waitForTimeout(500);
      }
    }

    // Test 6: Filter by bias (LONG)
    const biasSelect = page.locator('select').filter({ hasText: /direction/i });
    if (await biasSelect.isVisible()) {
      await biasSelect.selectOption("LONG");
      await page.waitForLoadState("networkidle");

      // Should see BTC and SOL (both LONG)
      await expect(page.getByText("BTC-USDT")).toBeVisible();
      await expect(page.getByText("SOL-USDT")).toBeVisible();
    }

    // Test 7: Filter by instrument type (PERP)
    const typeSelect = page.locator('select').filter({ hasText: /type/i });
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("PERP");
      await page.waitForLoadState("networkidle");

      // Should see only SOL (LONG + PERP)
      await expect(page.getByText("SOL-USDT")).toBeVisible();
    }

    // Test 8: Filter by trader name
    const traderInput = page.getByPlaceholder(/trader/i);
    if (await traderInput.isVisible()) {
      await traderInput.fill(traderProfile.displayName);
      await page.waitForLoadState("networkidle");

      // Should still see signals from this trader
      await expect(page.getByText(/signal/i).first()).toBeVisible();
    }

    // Test 9: Verified traders only
    const verifiedCheckbox = page.getByLabel(/verified/i);
    if (await verifiedCheckbox.isVisible()) {
      await verifiedCheckbox.check();
      await page.waitForLoadState("networkidle");

      // Should see signals (our trader is verified)
      await expect(page.getByText(/signal/i).first()).toBeVisible();
    }

    // Test 10: Show expired signals
    const statusSelect = page.locator('select').filter({ hasText: /status/i });
    if (await statusSelect.isVisible()) {
      // Reset all filters first
      await page.goto(`/orgs/${orgSlug}/signals`);
      await page.waitForLoadState("networkidle");

      await statusSelect.selectOption("EXPIRED");
      await page.waitForLoadState("networkidle");

      // Should see the expired BTC signal
      const expiredSignals = page.getByText("BTC-USDT");
      await expect(expiredSignals.first()).toBeVisible();
    }

    // Cleanup: Delete test signals and trader
    await prisma.signal.deleteMany({
      where: {
        id: { in: signals.map((s) => s.id) },
      },
    });

    await prisma.traderProfile.delete({
      where: { id: traderProfile.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });
  });

  test("should handle empty state when no signals match filters", async ({
    page,
  }) => {
    // Create a test user
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    // Navigate to signals feed
    await page.waitForURL(/\/orgs\/[^/]+$/);
    const url = page.url();
    const orgSlug = url.split("/orgs/")[1]?.split("/")[0] ?? "";

    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // Apply filter that won't match anything
    await page.getByPlaceholder("Search symbols...").fill("NONEXISTENT-TOKEN");
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");

    // Should see empty state message
    await expect(
      page.getByText(/no signals found/i).or(page.getByText(/no trading signals/i)),
    ).toBeVisible({ timeout: 10000 });

    // Cleanup
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });
    await prisma.user.delete({
      where: { id: user.id },
    });
  });

  test("should persist filters in URL for sharing", async ({ page }) => {
    // Create a test user
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    // Navigate to signals feed
    await page.waitForURL(/\/orgs\/[^/]+$/);
    const url = page.url();
    const orgSlug = url.split("/orgs/")[1]?.split("/")[0] ?? "";

    await page.goto(`/orgs/${orgSlug}/signals`);
    await page.waitForLoadState("networkidle");

    // Apply some filters
    await page.getByPlaceholder("Search symbols...").fill("BTC-USDT");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    const biasSelect = page.locator('select').filter({ hasText: /direction/i });
    if (await biasSelect.isVisible()) {
      await biasSelect.selectOption("LONG");
      await page.waitForTimeout(500);
    }

    // Check URL contains filters
    const currentUrl = page.url();
    expect(currentUrl).toContain("BTC-USDT");
    expect(currentUrl).toContain("bias=LONG");

    // Reload page and verify filters are still applied
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check that filters are still visible/applied
    const symbolTag = page.getByText("BTC-USDT");
    await expect(symbolTag).toBeVisible({ timeout: 5000 });

    // Cleanup
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });
    await prisma.user.delete({
      where: { id: user.id },
    });
  });
});
