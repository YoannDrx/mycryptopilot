import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

const extractOrgSlug = (page: Page) => {
  const url = new URL(page.url());
  const match = url.pathname.match(/\/orgs\/([^/]+)/);

  if (!match) {
    throw new Error("Active organization slug not found in URL");
  }

  return match[1];
};

test.describe("account", () => {
  test("delete account flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/[^/]+$/, { timeout: 10000 });
    const orgSlug = extractOrgSlug(page);

    await page.goto(`/orgs/${orgSlug}/account`);
    await page.getByRole("link", { name: /danger zone/i }).click();
    await page.waitForURL(new RegExp(`/orgs/${orgSlug}/account/danger`), {
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Delete" }).click();

    const deleteDialog = page.getByRole("alertdialog", {
      name: "Delete your account ?",
    });
    await expect(deleteDialog).toBeVisible();

    const confirmInput = deleteDialog.getByRole("textbox");
    await confirmInput.fill("Delete");

    const deleteButton = deleteDialog.getByRole("button", { name: /delete/i });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await expect(page.getByText("Your deletion has been asked.")).toBeVisible();

    const verification = await prisma.verification.findFirst({
      where: {
        identifier: {
          contains: "delete-account",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const token = verification?.identifier.replace("delete-account-", "");
    expect(token).not.toBeNull();

    const resetToken = token;
    const confirmUrl = `${getServerUrl()}/auth/confirm-delete?token=${resetToken}&callbackUrl=/auth/goodbye`;
    await page.goto(confirmUrl);

    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();
    await page.waitForURL(/\/auth\/goodbye/, { timeout: 10000 });
    await expect(
      page
        .locator('div[data-slot="card-header"]', {
          hasText: "Account Deleted",
        })
        .first(),
    ).toBeVisible();

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user).toBeNull();
  });

  test("update name flow", async ({ page }) => {
    await createTestAccount({ page, callbackURL: "/orgs" });

    await page.waitForURL(/\/orgs\/[^/]+$/, { timeout: 10000 });
    const orgSlug = extractOrgSlug(page);

    await page.goto(`/orgs/${orgSlug}/account`);

    const newName = faker.person.fullName();
    const input = page.getByRole("textbox", { name: "Name" });
    await input.fill(newName);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Profile updated")).toBeVisible();
    await page.reload();
    await page.waitForURL(new RegExp(`/orgs/${orgSlug}/account`), {
      timeout: 10000,
    });
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
      newName,
    );
  });

  test("change password flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/[^/]+$/, { timeout: 10000 });
    const orgSlug = extractOrgSlug(page);

    const accountPath = `/orgs/${orgSlug}/account`;

    await page.goto(accountPath);

    await page.getByRole("link", { name: /change password/i }).click();
    await page.waitForURL(new RegExp(`${accountPath}/change-password`), {
      timeout: 10000,
    });

    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    await page.locator('input[name="currentPassword"]').fill(userData.password);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.getByRole("button", { name: /Change Password/i }).click();

    // Wait for toast to appear (uses default 15s timeout from playwright.config.ts)
    await expect(page.getByText("Password changed successfully")).toBeVisible();

    // Wait for navigation back to /account
    await page.waitForURL(new RegExp(`${accountPath}$`), { timeout: 5000 });

    await signOutAccount({ page });

    await signInAccount({
      page,
      userData: {
        email: userData.email,
        password: newPassword,
      },
      callbackURL: "/orgs",
    });

    await page.waitForURL(/\/orgs\/.*/, { timeout: 10000 });

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});
