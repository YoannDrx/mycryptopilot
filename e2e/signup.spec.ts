import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test("sign up and verify account creation", async ({ page }) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/dashboard",
  });

  // Wait for redirect to dashboard (user-centric architecture)
  await page.waitForURL(/\/dashboard/);

  // Verify we're on the dashboard page
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/dashboard/);

  // Verify the user was created in the database
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
    include: {
      userSubscription: true,
      traderProfile: true,
    },
  });

  // Verify user exists
  expect(user).not.toBeNull();
  expect(user?.name).toBe(userData.name);
  expect(user?.email).toBe(userData.email);
  expect(user?.emailVerified).toBe(false); // Email should not be verified yet

  // Verify user has default free plan
  expect(user?.planName).toBe("free");

  // Clean up - delete the test user
  if (user) {
    await prisma.user.delete({
      where: { id: user.id },
    });
  }
});
