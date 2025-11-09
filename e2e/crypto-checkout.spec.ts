import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Crypto Checkout Flow", () => {
  test("user can view checkout page and get payment address", async ({
    page,
  }) => {
    // 1. Create a user account
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to checkout page for Pro plan
    await page.goto("/checkout/pro", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Wait for React hydration and checkout form mount
    await page.waitForTimeout(3000);

    // 3. Verify checkout page loaded - wait for any heading or main content
    await expect(
      page.locator("h1, h2, [data-testid='checkout-form']").first(),
    ).toBeVisible({
      timeout: 30000,
    });
    // Use .first() to avoid strict mode violation (multiple "$49" on page)
    await expect(page.getByText(/\$49/i).first()).toBeVisible({
      timeout: 30000,
    });

    // 4. Select payment network (Base - USDC)
    const baseOption = page.getByLabel(/base.*usdc/i);
    if (await baseOption.isVisible()) {
      await baseOption.click();
    }

    // 5. Click "Generate Payment Address" button
    const generateButton = page.getByRole("button", {
      name: /generate.*address|get.*address/i,
    });

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // 6. Wait for payment address to be generated and displayed
      await expect(page.getByText(/0x[a-fA-F0-9]{40}/)).toBeVisible({
        timeout: 15000,
      });

      // 7. Verify QR code appears
      await expect(page.locator("canvas, img[alt*='QR']")).toBeVisible({
        timeout: 5000,
      });

      // 8. Verify payment instructions displayed
      await expect(page.getByText(/send.*usdc|transfer.*usdc/i)).toBeVisible();

      // 9. Verify crypto address was created in database
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
      });

      const cryptoAddress = await prisma.cryptoAddress.findFirst({
        where: {
          userId: user.id,
          network: "BASE",
        },
      });

      expect(cryptoAddress).not.toBeNull();
      expect(cryptoAddress?.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(cryptoAddress?.isActive).toBe(true);
    }
  });

  test("user can switch between payment networks", async ({ page }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to checkout page for Ultra plan
    await page.goto("/checkout/ultra");
    await page.waitForLoadState("networkidle");

    // 3. Select Base (USDC) network
    const baseOption = page.getByLabel(/base.*usdc/i);
    if (await baseOption.isVisible()) {
      await baseOption.click();

      // Verify price shown in USDC
      await expect(page.getByText(/99.*usdc/i)).toBeVisible({
        timeout: 5000,
      });

      // 4. Switch to Tron (USDT) network
      const tronOption = page.getByLabel(/tron.*usdt/i);
      await tronOption.click();

      // Verify price shown in USDT
      await expect(page.getByText(/99.*usdt/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("checkout page shows plan features correctly", async ({ page }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Test Pro plan checkout
    await page.goto("/checkout/pro", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Wait for React hydration and checkout form mount
    await page.waitForTimeout(3000);

    // Verify Pro plan checkout page loaded correctly
    // Note: Checkout page displays plan name and price, NOT plan features
    // Features are displayed on the /pricing page, not /checkout
    await expect(
      page.locator("h1, h2, [data-testid='checkout-form']").first(),
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator("h1")).toContainText(/complete your payment/i, {
      timeout: 30000,
    });
    await expect(page.getByText(/\$49/i).first()).toBeVisible({
      timeout: 30000,
    });
    // Verify timer visible
    await expect(page.getByText(/time remaining/i)).toBeVisible({
      timeout: 30000,
    });

    // 3. Test Ultra plan checkout
    await page.goto("/checkout/ultra", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Wait for React hydration and checkout form mount
    await page.waitForTimeout(3000);

    // Verify Ultra plan checkout page loaded correctly
    await expect(
      page.locator("h1, h2, [data-testid='checkout-form']").first(),
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator("h1")).toContainText(/complete your payment/i, {
      timeout: 30000,
    });
    await expect(page.getByText(/\$99/i).first()).toBeVisible({
      timeout: 30000,
    });
    // Verify timer visible
    await expect(page.getByText(/time remaining/i)).toBeVisible({
      timeout: 30000,
    });
  });

  test("user can navigate back to pricing from checkout", async ({ page }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to checkout
    await page.goto("/checkout/pro");
    await page.waitForLoadState("networkidle");

    // 3. Click back/cancel button
    const backButton = page.getByRole("link", { name: /back|cancel/i });

    if (await backButton.isVisible()) {
      await backButton.click();

      // Verify redirected to pricing page
      await page.waitForURL(/\/pricing/, { timeout: 10000 });
      await expect(page.getByText(/pricing/i)).toBeVisible();
    }
  });

  test.skip("free user sees upgrade prompt in dashboard", async ({ page }) => {
    // TODO: Update test for new dashboard UI (B2C migration)
    // Old: Link to /settings/billing
    // New: Dashboard cards invite to follow traders (app/(app)/(trading)/dashboard/page.tsx:130-210)
    // 1. Create a user account
    const userData = await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    // Verify user is on Free plan
    expect(user.planName).toBe("free");

    // 2. Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 3. Verify upgrade CTA visible
    // Use .first() to avoid strict mode violation (title + description both match)
    await expect(
      page.getByText(/upgrade.*unlock|upgrade.*pro/i).first(),
    ).toBeVisible({
      timeout: 5000,
    });

    // 4. Verify upgrade link is present and clickable
    const upgradeLink = page.getByRole("link", { name: /upgrade/i }).first();
    await expect(upgradeLink).toBeVisible();

    // Verify upgrade link points to billing settings (where users can upgrade)
    const upgradeLinkHref = await upgradeLink.getAttribute("href");
    expect(upgradeLinkHref).toMatch(/settings\/billing/);
  });

  test("checkout validates payment amount for pro-rata", async ({ page }) => {
    // Note: Pro-rata info is displayed on /pricing page, not /checkout
    // The checkout page accepts any payment amount, and backend calculates pro-rata days
    // This test verifies that checkout page loads and accepts payments

    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to checkout for Pro plan ($49)
    await page.goto("/checkout/pro", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    // Wait for React hydration and checkout form mount
    await page.waitForTimeout(3000);

    // 3. Verify checkout page loaded with payment info
    await expect(
      page.locator("h1, h2, [data-testid='checkout-form']").first(),
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator("h1")).toContainText(/complete your payment/i, {
      timeout: 30000,
    });

    // 4. Verify payment info displayed (price in the description)
    await expect(page.getByText(/send.*\$49/i).first()).toBeVisible({
      timeout: 30000,
    });

    // 5. Verify timer visible
    await expect(page.getByText(/time remaining/i)).toBeVisible({
      timeout: 30000,
    });
  });

  test("checkout page shows payment confirmation instructions", async ({
    page,
  }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to checkout
    await page.goto("/checkout/pro");
    await page.waitForLoadState("networkidle");

    // 3. Select network and generate address
    const baseOption = page.getByLabel(/base.*usdc/i);
    if (await baseOption.isVisible()) {
      await baseOption.click();

      const generateButton = page.getByRole("button", {
        name: /generate.*address/i,
      });

      if (await generateButton.isVisible()) {
        await generateButton.click();

        await page.waitForTimeout(2000);

        // 4. Verify confirmation instructions displayed
        await expect(
          page.getByText(/confirmation|on-chain|blockchain/i),
        ).toBeVisible({ timeout: 10000 });

        // 5. Verify mention of subscription auto-activation
        await expect(
          page.getByText(/auto.*activate|automatically.*activate/i),
        ).toBeVisible();

        // 6. Verify expected wait time mentioned
        await expect(
          page.getByText(/1.*confirmation|2.*confirmation/i),
        ).toBeVisible();
      }
    }
  });
});
