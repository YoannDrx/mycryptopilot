/**
 * Seed Referral System Test Data
 *
 * Creates a complete test trader account with:
 * - Trader profile
 * - Multiple invitations (various statuses)
 * - Credits transactions
 * - Tier progression (SILVER)
 * - Followers
 * - Recent signals
 */

import { prisma } from "../src/lib/prisma";
import { logger } from "../src/lib/logger";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const TEST_TRADER = {
  email: "trader-test@mycryptopilot.com",
  password: "Test123!@#", // Plain text password (will be hashed)
  name: "Test Trader",
  displayName: "CryptoMaster Pro",
  bio: "Professional crypto trader with 5+ years experience. Specializing in BTC/ETH swing trading with proven 70%+ win rate.",
};

async function main() {
  logger.info("🌱 Starting referral system test data seed...");

  // 1. Create test trader user
  logger.info("Creating test trader user...");

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: TEST_TRADER.email },
  });

  if (user) {
    logger.info(
      `User ${TEST_TRADER.email} already exists, deleting old data...`,
    );
    // Delete old data (cascade will delete all related data)
    await prisma.user.delete({ where: { id: user.id } });
  }

  // Generate unique ID and hash password
  const userId = nanoid();
  const hashedPassword = await bcrypt.hash(TEST_TRADER.password, 10);

  // Create new user with Better Auth format
  user = await prisma.user.create({
    data: {
      id: userId,
      email: TEST_TRADER.email,
      name: TEST_TRADER.name,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRole: "TRADER",
      planName: "pro", // Give Pro plan for testing
      planExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });

  // Create account (Better Auth password credential)
  await prisma.account.create({
    data: {
      id: nanoid(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  logger.info(`✅ User created: ${user.id}`);

  // Create organization (required for Better Auth)
  const organization = await prisma.organization.create({
    data: {
      id: nanoid(),
      name: `${TEST_TRADER.name}'s Organization`,
      slug: `${TEST_TRADER.email.split("@")[0]}-org`,
      createdAt: new Date(),
    },
  });

  // Create member record (link user to organization)
  await prisma.member.create({
    data: {
      id: nanoid(),
      organizationId: organization.id,
      userId: user.id,
      role: "owner",
      createdAt: new Date(),
    },
  });

  logger.info(`✅ Organization created: ${organization.slug}`);

  // 2. Create trader profile
  logger.info("Creating trader profile...");
  const traderProfile = await prisma.traderProfile.create({
    data: {
      userId: user.id,
      displayName: TEST_TRADER.displayName,
      bio: TEST_TRADER.bio,
      verified: true,
      verifiedAt: new Date(),
      statsJson: {
        winrate: 72.5,
        payoff: 2.3,
        totalSignals: 156,
        activeSignals: 8,
        closedSignals: 148,
        winningTrades: 107,
        losingTrades: 41,
      },
    },
  });

  logger.info(`✅ Trader profile created: ${traderProfile.id}`);

  // 3. Create invitations with various statuses
  logger.info("Creating test invitations...");
  const invitations = [
    // ACCEPTED invitations (active users)
    {
      email: "active-user-1@test.com",
      status: "ACCEPTED" as const,
      acceptedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      landingViews: 1,
      clickedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      creditsAwarded: 15, // signup (5) + active 30d (10)
      inviteeActive: true,
      inviteeUpgraded: false,
      personalMessage:
        "Hey! Join me on MyCryptoPilot and get my trading signals!",
    },
    {
      email: "active-user-2@test.com",
      status: "ACCEPTED" as const,
      acceptedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      landingViews: 2,
      clickedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      creditsAwarded: 65, // signup (5) + active (10) + upgrade Pro (50)
      inviteeActive: true,
      inviteeUpgraded: true,
      inviteeUpgradedPlan: "pro",
      inviteeUpgradedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      personalMessage:
        "I've been making great profits with my strategy. Check it out!",
    },
    {
      email: "active-user-3@test.com",
      status: "ACCEPTED" as const,
      acceptedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      landingViews: 1,
      clickedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      creditsAwarded: 15,
      inviteeActive: true,
      inviteeUpgraded: false,
    },
    {
      email: "upgraded-ultra@test.com",
      status: "ACCEPTED" as const,
      acceptedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      landingViews: 1,
      clickedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      creditsAwarded: 115, // signup (5) + active (10) + upgrade Ultra (100)
      inviteeActive: true,
      inviteeUpgraded: true,
      inviteeUpgradedPlan: "ultra",
      inviteeUpgradedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
      personalMessage:
        "This platform is amazing! Join me and level up your trading game.",
    },
    // ACCEPTED but not active yet (recent signups)
    {
      email: "recent-signup-1@test.com",
      status: "ACCEPTED" as const,
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      landingViews: 1,
      clickedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      creditsAwarded: 5, // only signup bonus
      inviteeActive: false,
      inviteeUpgraded: false,
    },
    {
      email: "recent-signup-2@test.com",
      status: "ACCEPTED" as const,
      acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      landingViews: 3,
      clickedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      creditsAwarded: 5,
      inviteeActive: false,
      inviteeUpgraded: false,
    },
    // PENDING invitations (not yet accepted)
    {
      email: "pending-invite-1@test.com",
      status: "PENDING" as const,
      acceptedAt: null,
      landingViews: 0,
      clickedAt: null,
      creditsAwarded: 0,
      inviteeActive: false,
      inviteeUpgraded: false,
      personalMessage: "Hey! You should really check this out.",
    },
    {
      email: "pending-invite-2@test.com",
      status: "PENDING" as const,
      acceptedAt: null,
      landingViews: 2,
      clickedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      creditsAwarded: 0,
      inviteeActive: false,
      inviteeUpgraded: false,
    },
    {
      email: "pending-invite-3@test.com",
      status: "PENDING" as const,
      acceptedAt: null,
      landingViews: 1,
      clickedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      creditsAwarded: 0,
      inviteeActive: false,
      inviteeUpgraded: false,
    },
    // EXPIRED invitation
    {
      email: "expired-invite@test.com",
      status: "EXPIRED" as const,
      acceptedAt: null,
      landingViews: 0,
      clickedAt: null,
      creditsAwarded: 0,
      inviteeActive: false,
      inviteeUpgraded: false,
    },
    // Suspicious invitation (disposable email)
    {
      email: "test@tempmail.com",
      status: "PENDING" as const,
      acceptedAt: null,
      landingViews: 0,
      clickedAt: null,
      creditsAwarded: 0,
      inviteeActive: false,
      inviteeUpgraded: false,
      isSuspicious: true,
      suspiciousReason: "Disposable email address detected",
      signupIp: "192.168.1.100",
    },
  ];

  await Promise.all(
    invitations.map(async (inviteData) => {
      const expiresAt = new Date();
      if (inviteData.status === "EXPIRED") {
        expiresAt.setDate(expiresAt.getDate() - 1); // Expired yesterday
      } else {
        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
      }

      return prisma.traderInvitation.create({
        data: {
          traderId: user.id,
          email: inviteData.email,
          token:
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15),
          status: inviteData.status,
          expiresAt,
          acceptedAt: inviteData.acceptedAt,
          landingViews: inviteData.landingViews,
          clickedAt: inviteData.clickedAt,
          creditsAwarded: inviteData.creditsAwarded,
          inviteeActive: inviteData.inviteeActive,
          inviteeUpgraded: inviteData.inviteeUpgraded,
          inviteeUpgradedPlan: inviteData.inviteeUpgradedPlan,
          inviteeUpgradedAt: inviteData.inviteeUpgradedAt,
          personalMessage: inviteData.personalMessage,
          isSuspicious: inviteData.isSuspicious ?? false,
          suspiciousReason: inviteData.suspiciousReason,
          signupIp: inviteData.signupIp,
          source: "EMAIL",
        },
      });
    }),
  );

  logger.info(`✅ Created ${invitations.length} test invitations`);

  // 4. Create referral credits transactions
  logger.info("Creating referral credits...");
  const totalCreditsEarned = invitations.reduce(
    (sum, inv) => sum + inv.creditsAwarded,
    0,
  );

  // Create individual credit transactions
  const creditTransactions: {
    type:
      | "EARNED_SIGNUP"
      | "EARNED_ACTIVE"
      | "EARNED_UPGRADE_PRO"
      | "EARNED_UPGRADE_ULTRA";
    amount: number;
    reason: string;
  }[] = [
    {
      type: "EARNED_SIGNUP",
      amount: 5,
      reason: "Invitation accepted: active-user-1@test.com",
    },
    {
      type: "EARNED_ACTIVE",
      amount: 10,
      reason: "User active 30+ days: active-user-1@test.com",
    },
    {
      type: "EARNED_SIGNUP",
      amount: 5,
      reason: "Invitation accepted: active-user-2@test.com",
    },
    {
      type: "EARNED_ACTIVE",
      amount: 10,
      reason: "User active 30+ days: active-user-2@test.com",
    },
    {
      type: "EARNED_UPGRADE_PRO",
      amount: 50,
      reason: "User upgraded to Pro: active-user-2@test.com",
    },
    {
      type: "EARNED_SIGNUP",
      amount: 5,
      reason: "Invitation accepted: active-user-3@test.com",
    },
    {
      type: "EARNED_ACTIVE",
      amount: 10,
      reason: "User active 30+ days: active-user-3@test.com",
    },
    {
      type: "EARNED_SIGNUP",
      amount: 5,
      reason: "Invitation accepted: upgraded-ultra@test.com",
    },
    {
      type: "EARNED_ACTIVE",
      amount: 10,
      reason: "User active 30+ days: upgraded-ultra@test.com",
    },
    {
      type: "EARNED_UPGRADE_ULTRA",
      amount: 100,
      reason: "User upgraded to Ultra: upgraded-ultra@test.com",
    },
    {
      type: "EARNED_SIGNUP",
      amount: 5,
      reason: "Invitation accepted: recent-signup-1@test.com",
    },
    {
      type: "EARNED_SIGNUP",
      amount: 5,
      reason: "Invitation accepted: recent-signup-2@test.com",
    },
  ];

  await Promise.all(
    creditTransactions.map(async (tx) =>
      prisma.referralCredit.create({
        data: {
          traderId: user.id,
          amount: tx.amount,
          type: tx.type,
          reason: tx.reason,
        },
      }),
    ),
  );

  logger.info(
    `✅ Created ${creditTransactions.length} credit transactions (Total: ${totalCreditsEarned} credits)`,
  );

  // 5. Create referral tier (SILVER - 10-49 active invites)
  logger.info("Creating referral tier...");
  const activeInvitesCount = invitations.filter(
    (inv) => inv.inviteeActive,
  ).length;

  await prisma.referralTier.create({
    data: {
      traderId: user.id,
      tier: activeInvitesCount >= 10 ? "SILVER" : "BRONZE",
      activeInvitesCount,
      tierUpgradedAt:
        activeInvitesCount >= 10
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : null,
    },
  });

  logger.info(
    `✅ Tier created: ${activeInvitesCount >= 10 ? "SILVER" : "BRONZE"} (${activeInvitesCount} active invites)`,
  );

  // 6. Create a fraud log example
  logger.info("Creating fraud log example...");
  await prisma.fraudLog.create({
    data: {
      traderId: user.id,
      type: "DISPOSABLE_EMAIL",
      description: "Invitation sent to disposable email: test@tempmail.com",
      metadata: { email: "test@tempmail.com" },
      severity: "MEDIUM",
      resolved: false,
    },
  });

  logger.info("✅ Fraud log created");

  // 7. Create some test signals
  logger.info("Creating test signals...");
  const signals = [
    {
      symbol: "BTC/USDT",
      type: "LONG",
      entryPrice: 45250.5,
      stopLoss: 44100.0,
      takeProfit1: 46800.0,
      takeProfit2: 48200.0,
    },
    {
      symbol: "ETH/USDT",
      type: "LONG",
      entryPrice: 2845.75,
      stopLoss: 2780.0,
      takeProfit1: 2920.0,
      takeProfit2: 3050.0,
    },
    {
      symbol: "BNB/USDT",
      type: "SHORT",
      entryPrice: 385.2,
      stopLoss: 395.0,
      takeProfit1: 370.0,
      takeProfit2: 360.0,
    },
  ];

  await Promise.all(
    signals.map(async (signalData) => {
      const ttlSec = 7 * 24 * 60 * 60; // 7 days
      const expiresAt = new Date(Date.now() + ttlSec * 1000);

      return prisma.signal.create({
        data: {
          traderId: user.id,
          symbol: signalData.symbol,
          payloadJson: signalData,
          ttlSec,
          hash: Math.random().toString(36).substring(2, 15),
          expiresAt,
        },
      });
    }),
  );

  logger.info(`✅ Created ${signals.length} test signals`);

  // Summary
  logger.info(`\n${"=".repeat(60)}`);
  logger.info("🎉 Test data seed completed!");
  logger.info("=".repeat(60));
  logger.info("\n📧 TEST CREDENTIALS:");
  logger.info(`   Email: ${TEST_TRADER.email}`);
  logger.info(`   Password: ${TEST_TRADER.password}`);
  logger.info("\n📊 DATA CREATED:");
  logger.info(`   ✅ Trader Profile: ${TEST_TRADER.displayName}`);
  logger.info(`   ✅ Invitations: ${invitations.length}`);
  logger.info(
    `      - Accepted (active): ${invitations.filter((i) => i.status === "ACCEPTED" && i.inviteeActive).length}`,
  );
  logger.info(
    `      - Accepted (recent): ${invitations.filter((i) => i.status === "ACCEPTED" && !i.inviteeActive).length}`,
  );
  logger.info(
    `      - Pending: ${invitations.filter((i) => i.status === "PENDING").length}`,
  );
  logger.info(
    `      - Expired: ${invitations.filter((i) => i.status === "EXPIRED").length}`,
  );
  logger.info(
    `      - Suspicious: ${invitations.filter((i) => i.isSuspicious).length}`,
  );
  logger.info(`   ✅ Credits: ${totalCreditsEarned} credits earned`);
  logger.info(
    `   ✅ Tier: ${activeInvitesCount >= 10 ? "SILVER 🥈" : "BRONZE 🥉"} (${activeInvitesCount} active invites)`,
  );
  logger.info(`   ✅ Signals: ${signals.length} active signals`);
  logger.info(`   ✅ Fraud Logs: 1 unresolved`);
  logger.info("\n🚀 TO TEST:");
  logger.info("   1. Go to: http://localhost:3000/sign-in");
  logger.info(`   2. Sign in with: ${TEST_TRADER.email}`);
  logger.info("   3. Navigate to: Dashboard → Trader Dashboard");
  logger.info("   4. Check 'Invitations' tab to see all the referral system!");
  logger.info(`\n${"=".repeat(60)}\n`);
}

main()
  .catch((e) => {
    logger.error("Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
