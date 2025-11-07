import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "../utils/auth-test";

/**
 * ⏭️ SKIPPED - UI removed in 4-space architecture refactoring
 *
 * Reason: Organization slug editing UI no longer exists
 *
 * Same reasoning as org-details-update.spec.ts:
 * - MyCryptoPilot uses 1 org = 1 user (B2C model)
 * - Organization slug is auto-generated (org-{random})
 * - No need for users to customize organization slug
 * - Organization exists only for Better Auth compatibility
 *
 * Previous behavior:
 * - /orgs/[orgSlug]/settings had slug edit form
 * - Users could update org slug with validation
 *
 * Current behavior:
 * - /orgs/[orgSlug]/settings redirects to account settings
 * - No organization management UI
 *
 * This test is from NOW.TS template and not relevant for MyCryptoPilot.
 *
 * Priority: N/A (feature intentionally removed)
 */
test("update organization slug", async ({ page }) => {
  test.skip(
    true,
    "L'édition de slug d'organisation est temporairement indisponible dans la nouvelle navigation.",
  );
  // 1. Create a test account (owner)
  await createTestAccount({ page, callbackURL: "/orgs" });

  await page.waitForURL(/\/orgs\/[^/]+$/);

  await expect(
    page.getByRole("heading", { name: "Platform Overview" }),
  ).toBeVisible();

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

  await page.goto(`/orgs/${originalOrg.slug}/settings`);

  // 3. Click on the Members tab
  await page.getByRole("link", { name: /danger zone/i }).click();

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
