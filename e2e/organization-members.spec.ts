import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

test("invite and login as invited user", async ({ page }) => {
  // 1. Create a test account (owner)
  const ownerData = await createTestAccount({
    page,
    callbackURL: "/orgs",
  });

  // Wait for navigation to complete - we should be redirected to the organization page
  await page.waitForURL(/\/orgs\/.*/, { timeout: 30000 });

  // Extract organization slug from URL
  const currentUrl = page.url();
  const orgSlug = currentUrl.split("/orgs/")[1].split("/")[0];

  // 2. Navigate to organization settings page
  await page.waitForTimeout(1000);
  await page.goto(`/orgs/${orgSlug}/settings`);

  // 3. Click on the Members tab
  await page.getByRole("link", { name: /members/i }).click();

  // 4. Verify the current user is listed as an owner
  await expect(page.getByText("Owner")).toBeVisible();

  // 5. Open invite member dialog
  await page.getByRole("button", { name: /invite/i }).click();

  // 6. Fill out the invite form
  const memberEmail = faker.internet.email().toLowerCase();
  await page.getByLabel("Email").fill(memberEmail);

  // Send invitation (using default role)
  await page.getByRole("button", { name: /invite/i }).click();

  // Wait for the invitation to be sent
  await page.waitForTimeout(1000);

  // Click on the invitations tab to view pending invitations
  // The test is failing because the "Invitations" element is a tab, not a button
  // Based on the page snapshot, we need to use getByRole("tab") instead
  await page.getByRole("tab", { name: /invitations/i }).click();

  // 7. Verify the invitation appears in the list
  await expect(page.getByText(memberEmail)).toBeVisible();

  // Log out the current user
  await signOutAccount({ page });

  const invitedUserData = {
    email: memberEmail,
    password: "Jean1234",
    name: faker.person.firstName(),
  };

  await createTestAccount({
    page,
    callbackURL: "/account",
    initialUserData: invitedUserData,
  });

  // Wait to be on the account page after successful login
  await page.waitForURL(/\/account/, { timeout: 10000 });

  const lastInvitation = await prisma.invitation.findFirst({
    where: {
      email: memberEmail,
    },
    orderBy: {
      expiresAt: "desc",
    },
  });

  // Accept the invitation
  if (!lastInvitation) {
    throw new Error("No invitation found for the invited user");
  }

  // Navigate to the invitation acceptance URL
  await page.goto(
    `${getServerUrl()}/orgs/accept-invitation/${lastInvitation.id}`,
  );

  // Click the Accept Invitation button
  await page.getByRole("button", { name: /accept invitation/i }).click();

  // Verify the user is now a member of the organization
  await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}`));

  // login to the owner account
  await signOutAccount({ page });
  await signInAccount({
    page,
    userData: ownerData,
    callbackURL: `/orgs/${orgSlug}`,
  });

  // Verify the user is now a member of the organization
  await expect(page).toHaveURL(new RegExp(`/orgs/${orgSlug}`));

  // go to /members
  // Wait for a second before navigating to the members page
  await page.waitForTimeout(1000);

  await page.goto(`/orgs/${orgSlug}/settings/members`);

  // verify the invited user is listed
  await expect(page.getByText(memberEmail)).toBeVisible();

  // Find the dropdown menu for the invited member and click it
  const memberRow = page.getByText(memberEmail).locator("..").locator("..");
  await memberRow.getByRole("combobox").click();

  // Select the Admin role from the dropdown
  await page.getByRole("option", { name: "Admin" }).click();

  // Wait for the role update to be processed
  await page.getByText("Member role updated successfully").waitFor();

  // Refresh the page to verify the role change persisted
  await page.reload();

  // Verify the member's role is now Admin
  await expect(memberRow.getByRole("combobox")).toHaveText(/admin/i);
});
