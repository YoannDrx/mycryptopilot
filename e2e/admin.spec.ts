import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("admin", () => {
  test("verify admin navigation and pages", async ({ page }) => {
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
      admin: true,
    });

    await page.goto("/admin");

    // Test Admin section navigation
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();

    // Test Trading section navigation
    await expect(page.getByRole("link", { name: "Traders" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Signals" })).toBeVisible();

    // Test Finance section navigation
    await expect(
      page.getByRole("link", { name: "Crypto Payments" }),
    ).toBeVisible();

    // Navigate to Users
    await page.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL("/admin/users");

    // Navigate to Traders (new)
    await page.getByRole("link", { name: "Traders" }).click();
    await expect(page).toHaveURL("/admin/traders");

    // Navigate to Signals (new)
    await page.getByRole("link", { name: "Signals" }).click();
    await expect(page).toHaveURL("/admin/signals");

    // Navigate to Crypto Payments (new)
    await page.getByRole("link", { name: "Crypto Payments" }).click();
    await expect(page).toHaveURL("/admin/payments");
  });

  test("verify traders page displays correctly", async ({ page }) => {
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
      admin: true,
    });

    await page.goto("/admin/traders");

    // Check page title
    await expect(
      page.getByRole("heading", { name: "Trader Management" }),
    ).toBeVisible();

    // Check search input exists
    await expect(
      page.getByPlaceholder("Search traders by name or email..."),
    ).toBeVisible();

    // Check filter dropdown exists
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("verify signals page displays correctly", async ({ page }) => {
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
      admin: true,
    });

    await page.goto("/admin/signals");

    // Check page title
    await expect(
      page.getByRole("heading", { name: "Signal Management" }),
    ).toBeVisible();
  });

  test("verify payments page displays correctly", async ({ page }) => {
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
      admin: true,
    });

    await page.goto("/admin/payments");

    // Check page title
    await expect(
      page.getByRole("heading", { name: "Crypto Payments" }),
    ).toBeVisible();
  });
});
