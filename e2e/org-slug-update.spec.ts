import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test("update organization slug", async ({ page }) => {
  // 1. Create a test account (owner)
  await createTestAccount({ page, callbackURL: "/orgs" });

  // Wait for navigation to complete - we should be redirected to the organization page
  await page.waitForURL(/\/orgs\/.*/, { timeout: 30000 });

  // Extract organization slug from URL
  const currentUrl = page.url();
  const originalSlug = currentUrl.split("/orgs/")[1].split("/")[0];

  // Store the original organization data for verification
  const originalOrg = await prisma.organization.findFirst({
    where: {
      slug: originalSlug,
    },
  });

  if (!originalOrg) {
    throw new Error("Organization not found");
  }

  // 2. Navigate to organization danger settings page
  await page.goto(`${getServerUrl()}/orgs/${originalSlug}/settings/danger`);

  // 4. Generate a new organization slug
  const newSlug = `${faker.internet.domainWord().toLowerCase()}-${faker.string.alphanumeric(4).toLowerCase()}`;

  // 5. Find the slug input field and update it
  const slugInput = page.getByRole("textbox");

  // Verify the current value matches the original org slug
  await expect(slugInput).toHaveValue(originalSlug);

  // Update the slug
  await slugInput.clear();
  await slugInput.fill(newSlug);

  // 6. Click the save button
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // 7. Confirm the slug change in the dialog
  await page.getByRole("button", { name: /yes, change the slug/i }).click();

  // 8. Wait for navigation to the new URL
  await page.waitForURL(new RegExp(`/orgs/${newSlug}/settings/danger`), {
    timeout: 10000,
  });

  // 9. Verify the URL has been updated
  expect(page.url()).toContain(`/orgs/${newSlug}/`);

  // 10. Verify the organization was updated in the database
  const updatedOrg = await prisma.organization.findFirst({
    where: {
      id: originalOrg.id,
    },
  });

  expect(updatedOrg?.slug).toBe(newSlug);
});
