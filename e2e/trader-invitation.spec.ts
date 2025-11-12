import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";
import { createTestTrader } from "./utils/trader-test";

test.describe("Trader Invitation System", () => {
  test("complete invitation flow - send, accept, delete", async ({ page }) => {
    // 1. Create a trader
    const { userData: traderData, user: trader } = await createTestTrader({
      page,
    });

    // 2. Navigate to referral program page
    await page.goto("/trader-tools/referral");
    await page.waitForLoadState("domcontentloaded");

    // Click on Invitations tab
    await page.getByRole("tab", { name: /invitations/i }).click();

    // 3. Send invitation
    const followerEmail = `follower-${Date.now()}@test.com`;

    // Click "Invite Follower" button
    await page.getByRole("button", { name: /invite follower/i }).click();

    // Fill invitation form in dialog
    await page.getByLabel(/email/i).fill(followerEmail);
    await page.getByRole("button", { name: /send invitation/i }).click();

    // Wait for success toast
    await page.waitForSelector(`text=Invitation sent to ${followerEmail}`, {
      timeout: 10000,
    });

    // 4. Verify invitation exists in table
    await page.waitForSelector(`text=${followerEmail}`, { timeout: 5000 });

    // Get invitation from database
    const invitation = await prisma.traderInvitation.findFirst({
      where: {
        traderId: trader.id,
        email: followerEmail,
      },
    });

    expect(invitation).not.toBeNull();
    expect(invitation?.status).toBe("PENDING");

    // 5. Test resend functionality
    // After the invitation dialog closes, the page may reload and return to the default "signals" tab
    // We need to click on the "Invitations" tab again to see the invitation
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("tab", { name: /invitations/i }).click();

    // Find the row with the email and wait for resend button to be visible
    const invitationRow = page.locator(`tr:has-text("${followerEmail}")`);
    const resendButton = invitationRow.getByRole("button", { name: /resend/i });
    await expect(resendButton).toBeVisible({ timeout: 10000 });
    await resendButton.click();

    // Wait for success message
    await page.waitForSelector(`text=Invitation resent to ${followerEmail}`, {
      timeout: 10000,
    });

    // 6. Sign out trader and create follower account
    await signOutAccount({ page });

    // 7. Create follower account and accept invitation
    await createTestAccount({
      page,
      callbackURL: "/dashboard",
      initialUserData: {
        name: "Test Follower",
        email: followerEmail,
        password: "TestPassword123!",
      },
    });

    await page.waitForURL(/\/dashboard$/);

    // Get updated invitation with token
    const invitationWithToken = await prisma.traderInvitation.findFirst({
      where: {
        traderId: trader.id,
        email: followerEmail,
      },
    });

    expect(invitationWithToken).not.toBeNull();

    // Navigate to invitation acceptance page
    await page.goto(`/invite/accept/${invitationWithToken?.token}`);
    await page.waitForLoadState("domcontentloaded");

    // Should see trader name and follow button
    await expect(page.getByRole("button", { name: /follow/i })).toBeVisible();

    // Click follow button
    await page.getByRole("button", { name: /follow/i }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard$/, { timeout: 30000 });

    // Verify invitation status is ACCEPTED
    const acceptedInvitation = await prisma.traderInvitation.findFirst({
      where: {
        traderId: trader.id,
        email: followerEmail,
      },
    });

    expect(acceptedInvitation?.status).toBe("ACCEPTED");
    expect(acceptedInvitation?.acceptedAt).not.toBeNull();

    // Verify follow relationship exists
    const follow = await prisma.follow.findFirst({
      where: {
        traderId: trader.id,
        user: {
          email: followerEmail,
        },
      },
    });

    expect(follow).not.toBeNull();

    // 8. Sign out follower and sign back in as trader
    await signOutAccount({ page });

    await page.goto("/auth/signin");
    await page.getByRole("button", { name: /use password/i }).click();
    await page.getByLabel("Email").fill(traderData.email);
    await page.locator('input[name="password"]').fill(traderData.password);
    await page
      .getByRole("button", { name: /sign in/i })
      .first()
      .click();

    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });

    // 9. Navigate back to invitations tab and delete invitation
    await page.goto("/trader-tools/referral");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("tab", { name: /invitations/i }).click();

    // Find invitation row and click delete
    const invRow = page.locator(`tr:has-text("${followerEmail}")`);
    await invRow.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion in dialog
    await page
      .getByRole("button", { name: /delete/i })
      .last()
      .click();

    // Wait for success message
    await page.waitForSelector("text=Invitation deleted", { timeout: 10000 });

    // Verify invitation is deleted
    const deletedInvitation = await prisma.traderInvitation.findFirst({
      where: {
        traderId: trader.id,
        email: followerEmail,
      },
    });

    expect(deletedInvitation).toBeNull();

    // Cleanup
    await prisma.user.delete({ where: { id: trader.id } });
    const follower = await prisma.user.findUnique({
      where: { email: followerEmail },
    });
    if (follower) {
      await prisma.user.delete({ where: { id: follower.id } });
    }
  });

  test("cannot accept own invitation", async ({ page }) => {
    // Create trader
    const { user: trader } = await createTestTrader({ page });

    // Create invitation manually
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.traderInvitation.create({
      data: {
        traderId: trader.id,
        email: "other@test.com",
        token,
        expiresAt,
        status: "PENDING",
      },
    });

    // Navigate to acceptance page while logged in as trader
    await page.goto(`/invite/accept/${token}`);
    await page.waitForLoadState("domcontentloaded");

    // Click accept button
    await page.getByRole("button", { name: /follow/i }).click();

    // Should show error
    await page.waitForSelector("text=You cannot accept your own invitation", {
      timeout: 10000,
    });

    // Cleanup
    await prisma.traderInvitation.delete({ where: { id: invitation.id } });
    await prisma.user.delete({ where: { id: trader.id } });
  });

  test("expired invitation shows correct status", async ({ page }) => {
    // Create trader
    const { user: trader } = await createTestTrader({ page });

    // Create expired invitation
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 1); // Expired yesterday

    const invitation = await prisma.traderInvitation.create({
      data: {
        traderId: trader.id,
        email: "expired@test.com",
        token,
        expiresAt,
        status: "PENDING",
      },
    });

    // Navigate to acceptance page
    await page.goto(`/invite/accept/${token}`);
    await page.waitForLoadState("domcontentloaded");

    // Should show "Invitation Not Found" or expired message
    await expect(page.getByText(/invitation.*invalid.*expired/i)).toBeVisible();

    // Cleanup
    await prisma.traderInvitation.delete({ where: { id: invitation.id } });
    await prisma.user.delete({ where: { id: trader.id } });
  });
});
