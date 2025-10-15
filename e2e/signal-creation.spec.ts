import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestTrader } from "./utils/trader-test";

test.describe("Signal Creation Flow", () => {
  test("trader can create a complete trading signal", async ({ page }) => {
    // 1. Create a trader account
    const { user, traderProfile } = await createTestTrader({ page });

    // 2. Navigate to create signal page
    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];
    expect(orgSlug).toBeTruthy();

    await page.goto(`/orgs/${orgSlug}/dashboard/trader/signals/new`);
    await page.waitForLoadState("networkidle");

    // 3. Fill out signal creation form
    const signalData = {
      asset: "BTC",
      instrumentType: "PERP",
      bias: "LONG",
      entry: "45000",
      tp1: "46000",
      tp2: "47000",
      tp3: "48000",
      sl: "44000",
      leverage: "5",
      timeframe: "4H",
      riskLevel: "3",
      confidence: "75",
      rationale1: "Strong support at 44k level",
      rationale2: "Bullish divergence on RSI",
      rationale3: "Breakout above key resistance",
    };

    // Fill asset
    await page.getByLabel(/asset/i).fill(signalData.asset);

    // Select instrument type
    await page.getByLabel(/instrument type/i).click();
    await page.getByRole("option", { name: /perpetual/i }).click();

    // Select bias
    await page.getByLabel(/bias/i).click();
    await page.getByRole("option", { name: /^long$/i }).click();

    // Fill entry price
    await page.getByLabel(/entry price/i).fill(signalData.entry);

    // Fill take profits
    await page.getByLabel(/take profit 1/i).fill(signalData.tp1);
    await page.getByLabel(/take profit 2/i).fill(signalData.tp2);
    await page.getByLabel(/take profit 3/i).fill(signalData.tp3);

    // Fill stop loss
    await page.getByLabel(/stop loss/i).fill(signalData.sl);

    // Fill leverage
    await page.getByLabel(/leverage/i).fill(signalData.leverage);

    // Select timeframe
    await page.getByLabel(/timeframe/i).click();
    await page.getByRole("option", { name: /4h/i }).click();

    // Set risk level (slider)
    const riskSlider = page.getByLabel(/risk level/i);
    await riskSlider.fill(signalData.riskLevel);

    // Set confidence (slider)
    const confidenceSlider = page.getByLabel(/confidence/i);
    await confidenceSlider.fill(signalData.confidence);

    // Fill rationales
    const rationale1Input = page.locator('textarea[name*="rationale"]').first();
    await rationale1Input.fill(signalData.rationale1);

    const rationale2Input = page.locator('textarea[name*="rationale"]').nth(1);
    await rationale2Input.fill(signalData.rationale2);

    const rationale3Input = page.locator('textarea[name*="rationale"]').nth(2);
    await rationale3Input.fill(signalData.rationale3);

    // 4. Submit the form
    await page.getByRole("button", { name: /publish signal/i }).click();

    // 5. Wait for success message or redirect
    await page.waitForURL(/\/dashboard\/trader/, { timeout: 15000 });

    // 6. Verify signal was created in database
    const createdSignal = await prisma.signal.findFirst({
      where: {
        traderId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(createdSignal).not.toBeNull();
    expect(createdSignal?.symbol).toBe(signalData.asset);
    // Verify payloadJson contains the expected data
    const payload = createdSignal?.payloadJson as any;
    expect(payload?.bias).toBe(signalData.bias);

    // 7. Verify signal appears in trader's signals list
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(signalData.asset)).toBeVisible();
    await expect(page.getByText(signalData.rationale1)).toBeVisible();
  });

  test("signal creation validates required fields", async ({ page }) => {
    // 1. Create a trader account
    const { user } = await createTestTrader({ page });

    // 2. Navigate to create signal page
    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    await page.goto(`/orgs/${orgSlug}/dashboard/trader/signals/new`);
    await page.waitForLoadState("networkidle");

    // 3. Try to submit empty form
    await page.getByRole("button", { name: /publish signal/i }).click();

    // 4. Verify validation errors appear
    await expect(page.getByText(/asset.*required/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("trader can upload chart image to signal", async ({ page }) => {
    // 1. Create a trader account
    const { user } = await createTestTrader({ page });

    // 2. Navigate to create signal page
    const currentUrl = page.url();
    const orgSlug = currentUrl.split("/orgs/")[1]?.split("/")[0];

    await page.goto(`/orgs/${orgSlug}/dashboard/trader/signals/new`);
    await page.waitForLoadState("networkidle");

    // 3. Fill minimal required fields
    await page.getByLabel(/asset/i).fill("ETH");

    await page.getByLabel(/instrument type/i).click();
    await page.getByRole("option", { name: /spot/i }).click();

    await page.getByLabel(/bias/i).click();
    await page.getByRole("option", { name: /^long$/i }).click();

    await page.getByLabel(/entry price/i).fill("3000");
    await page.getByLabel(/take profit 1/i).fill("3100");
    await page.getByLabel(/stop loss/i).fill("2900");

    // 4. Upload a chart image (mock)
    // Note: This assumes there's a file input for chart upload
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a fake image buffer
      const buffer = Buffer.from("fake-image-data");
      await fileInput.setInputFiles({
        name: "chart.png",
        mimeType: "image/png",
        buffer: buffer,
      });

      // Verify image preview appears
      await expect(page.getByAltText(/chart/i)).toBeVisible({ timeout: 5000 });
    }

    // 5. Submit and verify
    await page.getByRole("button", { name: /publish signal/i }).click();
    await page.waitForURL(/\/dashboard\/trader/, { timeout: 15000 });

    // Verify signal was created
    const createdSignal = await prisma.signal.findFirst({
      where: {
        traderId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(createdSignal).not.toBeNull();
    expect(createdSignal?.symbol).toBe("ETH");
  });
});
