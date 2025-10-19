import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Cleanup orphaned data from database
 *
 * This function removes all orphaned records where foreign keys point to non-existent parents.
 * This is critical for test stability to avoid Prisma errors like:
 * "Field user is required to return data, got `null` instead"
 *
 * Run this before each test suite to ensure data integrity.
 */
export async function cleanupOrphanedData() {
  logger.info("Starting cleanup of orphaned data...");

  let deletedCount = 0;

  try {
    // 1. Delete orphaned TraderProfiles (userId -> non-existent User)
    // Use raw SQL to find profiles where user doesn't exist
    const orphanedProfiles = await prisma.$queryRaw<
      { id: string; userId: string }[]
    >`
      SELECT tp.id, tp."userId"
      FROM trader_profile tp
      LEFT JOIN "user" u ON tp."userId" = u.id
      WHERE u.id IS NULL
    `;

    if (orphanedProfiles.length > 0) {
      const profileIds = orphanedProfiles.map((p) => p.id);
      await prisma.traderProfile.deleteMany({
        where: { id: { in: profileIds } },
      });
      deletedCount += orphanedProfiles.length;
      logger.info(
        `Deleted ${orphanedProfiles.length} orphaned TraderProfiles`,
      );
    }

    // 2. Delete orphaned Signals (traderId -> non-existent User)
    const orphanedSignals = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s.id
      FROM signal s
      LEFT JOIN "user" u ON s."traderId" = u.id
      WHERE u.id IS NULL
    `;

    if (orphanedSignals.length > 0) {
      const signalIds = orphanedSignals.map((s) => s.id);
      await prisma.signal.deleteMany({
        where: { id: { in: signalIds } },
      });
      deletedCount += orphanedSignals.length;
      logger.info(`Deleted ${orphanedSignals.length} orphaned Signals`);
    }

    // 3. Delete orphaned Follows (userId or traderId -> non-existent User)
    const orphanedFollows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT f.id
      FROM follow f
      LEFT JOIN "user" u1 ON f."userId" = u1.id
      LEFT JOIN "user" u2 ON f."traderId" = u2.id
      WHERE u1.id IS NULL OR u2.id IS NULL
    `;

    if (orphanedFollows.length > 0) {
      const followIds = orphanedFollows.map((f) => f.id);
      await prisma.follow.deleteMany({
        where: { id: { in: followIds } },
      });
      deletedCount += orphanedFollows.length;
      logger.info(`Deleted ${orphanedFollows.length} orphaned Follows`);
    }

    // 4. Delete orphaned CryptoAddresses (userId -> non-existent User)
    const orphanedAddresses = await prisma.$queryRaw<{ id: string }[]>`
      SELECT ca.id
      FROM crypto_address ca
      LEFT JOIN "user" u ON ca."userId" = u.id
      WHERE u.id IS NULL
    `;

    if (orphanedAddresses.length > 0) {
      const addressIds = orphanedAddresses.map((a) => a.id);
      await prisma.cryptoAddress.deleteMany({
        where: { id: { in: addressIds } },
      });
      deletedCount += orphanedAddresses.length;
      logger.info(
        `Deleted ${orphanedAddresses.length} orphaned CryptoAddresses`,
      );
    }

    // 5. Delete orphaned CryptoPayments (addressId -> non-existent CryptoAddress)
    const orphanedPayments = await prisma.$queryRaw<{ id: string }[]>`
      SELECT cp.id
      FROM crypto_payment cp
      LEFT JOIN crypto_address ca ON cp."addressId" = ca.id
      WHERE ca.id IS NULL
    `;

    if (orphanedPayments.length > 0) {
      const paymentIds = orphanedPayments.map((p) => p.id);
      await prisma.cryptoPayment.deleteMany({
        where: { id: { in: paymentIds } },
      });
      deletedCount += orphanedPayments.length;
      logger.info(`Deleted ${orphanedPayments.length} orphaned CryptoPayments`);
    }

    // Note: Organization table doesn't have ownerId, so no cleanup needed
    // Member, Invitation, Subscription all have onDelete: Cascade configured

    if (deletedCount === 0) {
      logger.info("✓ No orphaned data found - database is clean");
    } else {
      logger.info(`✓ Cleanup complete - deleted ${deletedCount} orphaned records`);
    }

    return deletedCount;
  } catch (error) {
    logger.error("Failed to cleanup orphaned data", error);
    throw error;
  }
}

/**
 * Cleanup all test data (users, orgs, etc.)
 * More aggressive than cleanupOrphanedData - deletes ALL test users
 */
export async function cleanupAllTestData() {
  logger.info("Starting cleanup of all test data...");

  try {
    // Delete all users with playwright-test email prefix
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: "playwright-test-",
        },
      },
    });

    logger.info(`✓ Deleted ${deletedUsers.count} test users (cascade will clean related data)`);

    // Run orphaned cleanup as well to be safe
    await cleanupOrphanedData();

    return deletedUsers.count;
  } catch (error) {
    logger.error("Failed to cleanup test data", error);
    throw error;
  }
}
