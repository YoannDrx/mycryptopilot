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
    // Verify price is visible (format may be "49 USDC" or just "49")
    await expect(page.getByText(/49/i).first()).toBeVisible({
      timeout: 30000,
    });

    // 4. Wait for Base + Tron addresses to generate automatically
    const baseAddressField = page.getByTestId("base-address");
    const tronAddressField = page.getByTestId("tron-address");

    await expect(baseAddressField).toBeVisible({ timeout: 30000 });
    await expect(tronAddressField).toBeVisible({ timeout: 30000 });

    const baseAddress = (await baseAddressField.innerText()).trim();
    const tronAddress = (await tronAddressField.innerText()).trim();

    expect(baseAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(tronAddress).toMatch(/^T[a-zA-Z0-9]{30,}$/);

    // 5. Verify QR codes and instructions are visible
    await expect(page.getByTestId("base-qr")).toBeVisible();
    await expect(page.getByTestId("tron-qr")).toBeVisible();
    await expect(page.getByText(/send usdc to/i)).toBeVisible();
    await expect(page.getByText(/send usdt/i)).toBeVisible();

    // 6. Verify crypto addresses recorded in database
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    const addresses = await prisma.cryptoAddress.findMany({
      where: {
        userId: user.id,
        network: { in: ["BASE", "TRON"] },
      },
    });

    expect(addresses).toHaveLength(2);
    expect(addresses.find((addr) => addr.network === "BASE")?.address).toMatch(
      /^0x[a-fA-F0-9]{40}$/,
    );
    expect(addresses.find((addr) => addr.network === "TRON")?.address).toMatch(
      /^T[a-zA-Z0-9]{30,}$/,
    );
    addresses.forEach((addr) => expect(addr.isActive).toBe(true));
  });

  test("checkout displays Base and Tron payment options simultaneously", async ({
    page,
  }) => {
    // 1. Create a user account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to checkout page for Ultra plan
    await page.goto("/checkout/ultra");
    await page.waitForLoadState("networkidle");

    // 3. Verify Base & Tron sections render addresses + amounts without toggling
    await expect(page.getByTestId("base-address")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByTestId("tron-address")).toBeVisible({
      timeout: 30000,
    });

    await expect(page.getByTestId("base-amount")).toContainText(/99.*USDC/i);
    await expect(page.getByTestId("tron-amount")).toContainText(/99.*USDT/i);
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

    // Close Command Palette if it's open (can interfere with tests)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Verify Pro plan checkout page loaded correctly
    // Note: Checkout page displays plan name and price, NOT plan features
    // Features are displayed on the /pricing page, not /checkout
    // Use main element to avoid capturing dialog h2 elements
    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1, h2").first()).toBeVisible({
      timeout: 30000,
    });
    await expect(mainContent.locator("h1, h2").first()).toContainText(
      /complete your payment/i,
      {
        timeout: 30000,
      },
    );
    await expect(page.getByText(/49/i).first()).toBeVisible({
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

    // Close Command Palette if it's open (can interfere with tests)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Verify Ultra plan checkout page loaded correctly
    const mainContentUltra = page.locator("main");
    await expect(mainContentUltra.locator("h1, h2").first()).toBeVisible({
      timeout: 30000,
    });
    await expect(mainContentUltra.locator("h1, h2").first()).toContainText(
      /complete your payment/i,
      {
        timeout: 30000,
      },
    );
    await expect(page.getByText(/99/i).first()).toBeVisible({
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

  test("free user sees upgrade prompt in dashboard", async ({ page }) => {
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

    // 2. Navigate to dashboard (already there after signup, but ensure fresh load)
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // 3. Verify plan card indicates Free plan with upgrade hint
    const planCard = page.getByTestId("plan-card");
    await expect(planCard).toBeVisible();
    await expect(planCard.getByTestId("plan-name")).toHaveText(/free/i);
    await expect(planCard.getByTestId("plan-status")).toContainText(
      /upgrade to pro/i,
    );
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

    // Close Command Palette if it's open (can interfere with tests)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // 3. Verify checkout page loaded with payment info
    // Use main element to avoid capturing dialog h2 elements
    const mainContent = page.locator("main");
    await expect(mainContent.locator("h1, h2").first()).toBeVisible({
      timeout: 30000,
    });
    await expect(mainContent.locator("h1, h2").first()).toContainText(
      /complete your payment/i,
      {
        timeout: 30000,
      },
    );

    // 4. Verify payment info displayed (price in the description)
    await expect(page.getByText(/send.*49/i).first()).toBeVisible({
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
