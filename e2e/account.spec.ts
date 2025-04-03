import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

test.describe("account", () => {
  test("delete account flow", async ({ page }) => {
    // 1. Create a test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/account",
    });

    await page.getByRole("link", { name: "Danger" }).click();

    // Wait for navigation to the danger page
    await page.waitForURL(/\/account\/danger/, { timeout: 10000 });

    // Click on the Delete button
    await page.getByRole("button", { name: "Delete" }).click();

    // Wait for the confirmation dialog to appear
    const deleteDialog = page.getByRole("alertdialog", {
      name: "Delete your account ?",
    });
    await expect(deleteDialog).toBeVisible();

    // Type "delete" in the confirmation input
    await deleteDialog.getByRole("textbox").fill("delete");

    // Click the delete button in the confirmation dialog
    await deleteDialog.getByRole("button", { name: /delete/i }).click();

    // Wait for the verification to be created
    // Wait for the confirmation message to appear
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

    // 7. Navigate to the delete account page with the token
    const resetToken = token;
    await page.goto(
      `${getServerUrl()}/auth/confirm-delete?token=${resetToken}&callbackUrl=/auth/goodbye`,
    );

    // Click the confirmation button to delete the account
    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();

    // Wait for navigation to the goodbye page
    await page.waitForURL(/\/auth\/goodbye/, { timeout: 10000 });

    // Verify we're on the goodbye page
    await expect(page.getByText("Account Deleted")).toBeVisible();

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user).toBeNull();
  });

  test("update name flow", async ({ page }) => {
    // 1. Create a test account
    await createTestAccount({ page, callbackURL: "/account" });

    const newName = faker.person.fullName();

    const input = page.getByRole("textbox", { name: "Name" });
    await input.fill(newName);

    // Submit the form
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText("Profile updated")).toBeVisible();

    await page.reload();

    await expect(input).toHaveValue(newName);
  });

  test("change password flow", async ({ page }) => {
    // 1. Create a test account
    const userData = await createTestAccount({ page, callbackURL: "/account" });

    await page.getByRole("link", { name: /change password/i }).click();

    // 3. Fill out the change password form
    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    await page.locator('input[name="currentPassword"]').fill(userData.password);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.getByRole("button", { name: /Change Password/i }).click();

    // 4. Should see success message and be redirected to account page
    await expect(page.getByText("Password changed successfully")).toBeVisible();

    await signOutAccount({ page });

    await signInAccount({
      page,
      userData: {
        email: userData.email,
        password: newPassword,
      },
      callbackURL: "/orgs",
    });

    // 7. Should be redirected to the organization page
    await page.waitForURL(/\/orgs\/.*/, { timeout: 10000 });

    // Clean up - delete the test user
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
