import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Pricing Page", () => {
  test("pricing page displays all plans correctly", async ({ page }) => {
    // 1. Create a test account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to pricing page
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // 3. Verify page title and header
    await expect(
      page.getByRole("heading", { name: /simple.*transparent pricing/i }),
    ).toBeVisible();

    // 4. Verify payment badges are displayed
    await expect(page.getByText(/usdc.*base/i).first()).toBeVisible();
    await expect(page.getByText(/usdt.*tron/i).first()).toBeVisible();

    // 5. Verify all 3 plans are displayed (plan names are lowercase in DOM)
    await expect(page.getByText(/^free$/i).first()).toBeVisible();
    await expect(page.getByText(/^pro$/i).first()).toBeVisible();
    await expect(page.getByText(/^ultra$/i).first()).toBeVisible();

    // 6. Verify pricing information
    // Free plan should show "Free" (in a span, not heading)
    await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();

    // Pro plan should show $49/mo
    await expect(page.getByText(/\$49/i).first()).toBeVisible();

    // Ultra plan should show $99/mo
    await expect(page.getByText(/\$99/i).first()).toBeVisible();

    // 7. Verify "Most Popular" badge on Pro plan
    await expect(page.getByText(/most popular/i)).toBeVisible();

    // 8. Verify limits are displayed for each plan
    // Free: 3 active signals
    await expect(page.getByText(/3 active signals tracked/i)).toBeVisible();

    // Pro: 15 active signals, 5 traders
    await expect(page.getByText(/15 active signals tracked/i)).toBeVisible();
    await expect(page.getByText(/5 traders to follow/i)).toBeVisible();

    // Ultra: Unlimited
    await expect(
      page.getByText(/unlimited active signals tracked/i),
    ).toBeVisible();
    await expect(page.getByText(/unlimited traders to follow/i)).toBeVisible();

    // 9. Verify FAQ section
    await expect(
      page.getByRole("heading", { name: /frequently asked questions/i }),
    ).toBeVisible();

    // Check for common FAQ questions
    await expect(page.getByText(/how does crypto payment work/i)).toBeVisible();
    await expect(page.getByText(/can I pay less than/i)).toBeVisible();
    await expect(page.getByText(/how do I cancel/i)).toBeVisible();
  });

  test("pricing page subscribe button redirects to checkout", async ({
    page,
  }) => {
    // 1. Create a test account
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
    });

    await page.waitForURL(/\/dashboard$/);

    // 2. Navigate to pricing page
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // 3. Click "Subscribe Now" button for Pro plan
    // Find Pro plan card by searching for $49 price, then get its Subscribe button
    const subscribeButton = page
      .getByText(/\$49/)
      .locator("..")
      .locator("..")
      .locator("..")
      .getByRole("link", { name: /subscribe now/i });
    await expect(subscribeButton).toBeVisible();

    await subscribeButton.click();

    // 4. Verify redirect to checkout page
    await page.waitForURL(/\/checkout\/pro/, {
      timeout: 10000,
    });

    expect(page.url()).toContain("/checkout/pro");

    // 5. Verify checkout page loaded correctly
    // Should see plan name ("pro" in DOM), price, and payment options
    await expect(page.getByText(/pro/i).first()).toBeVisible();
    await expect(page.getByText(/\$49/i).first()).toBeVisible();

    // 6. Test Ultra plan subscribe button
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    const ultraSubscribeButton = page
      .getByText(/\$99/)
      .locator("..")
      .locator("..")
      .locator("..")
      .getByRole("link", { name: /subscribe now/i });
    await expect(ultraSubscribeButton).toBeVisible();

    await ultraSubscribeButton.click();

    await page.waitForURL(/\/checkout\/ultra/, {
      timeout: 10000,
    });

    expect(page.url()).toContain("/checkout/ultra");

    await expect(page.getByText(/ultra/i).first()).toBeVisible();
    await expect(page.getByText(/\$99/i).first()).toBeVisible();

    // 7. Test Free plan "Get Started" button redirects to dashboard
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    const freeCard = page.locator("div").filter({ hasText: /free/i }).first();
    await expect(freeCard).toBeVisible();

    const getStartedButton = freeCard.getByRole("link", {
      name: /get started/i,
    });
    await expect(getStartedButton).toBeVisible();

    await getStartedButton.click();

    await page.waitForURL(/\/dashboard$/, {
      timeout: 10000,
    });

    expect(page.url()).toContain("/dashboard");
  });
});
