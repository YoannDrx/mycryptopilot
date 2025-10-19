/**
 * Quick test script to verify cleanup functions work correctly
 * Run with: pnpm tsx scripts/test-cleanup.ts
 */

import { prisma } from "@/lib/prisma";
import { cleanupOrphanedData } from "../e2e/utils/cleanup";
import { logger } from "@/lib/logger";

async function testCleanup() {
  logger.info("🧪 Testing cleanup functions...");

  try {
    // 1. Find orphaned data before cleanup using raw SQL
    const orphanedProfilesBefore = await prisma.$queryRaw<
      { id: string }[]
    >`
      SELECT tp.id
      FROM trader_profile tp
      LEFT JOIN "user" u ON tp."userId" = u.id
      WHERE u.id IS NULL
    `;

    const orphanedSignalsBefore = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s.id
      FROM signal s
      LEFT JOIN "user" u ON s."traderId" = u.id
      WHERE u.id IS NULL
    `;

    const orphanedFollowsBefore = await prisma.$queryRaw<{ id: string }[]>`
      SELECT f.id
      FROM follow f
      LEFT JOIN "user" u1 ON f."userId" = u1.id
      LEFT JOIN "user" u2 ON f."traderId" = u2.id
      WHERE u1.id IS NULL OR u2.id IS NULL
    `;

    logger.info(
      `📊 Found before cleanup: ${orphanedProfilesBefore.length} orphaned TraderProfiles, ${orphanedSignalsBefore.length} orphaned Signals, ${orphanedFollowsBefore.length} orphaned Follows`,
    );

    // 2. Run cleanup
    const deletedCount = await cleanupOrphanedData();

    // 3. Find orphaned data after cleanup
    const orphanedProfilesAfter = await prisma.$queryRaw<{ id: string }[]>`
      SELECT tp.id
      FROM trader_profile tp
      LEFT JOIN "user" u ON tp."userId" = u.id
      WHERE u.id IS NULL
    `;

    const orphanedSignalsAfter = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s.id
      FROM signal s
      LEFT JOIN "user" u ON s."traderId" = u.id
      WHERE u.id IS NULL
    `;

    const orphanedFollowsAfter = await prisma.$queryRaw<{ id: string }[]>`
      SELECT f.id
      FROM follow f
      LEFT JOIN "user" u1 ON f."userId" = u1.id
      LEFT JOIN "user" u2 ON f."traderId" = u2.id
      WHERE u1.id IS NULL OR u2.id IS NULL
    `;

    logger.info(
      `📊 Found after cleanup: ${orphanedProfilesAfter.length} orphaned TraderProfiles, ${orphanedSignalsAfter.length} orphaned Signals, ${orphanedFollowsAfter.length} orphaned Follows`,
    );

    // 4. Verify cleanup worked
    if (
      orphanedProfilesAfter.length === 0 &&
      orphanedSignalsAfter.length === 0 &&
      orphanedFollowsAfter.length === 0
    ) {
      logger.info(
        `✅ SUCCESS: Cleanup removed ${deletedCount} orphaned records, database is clean!`,
      );
      process.exit(0);
    } else {
      logger.error(
        `❌ FAILURE: ${orphanedProfilesAfter.length + orphanedSignalsAfter.length + orphanedFollowsAfter.length} orphaned records still remain!`,
      );
      process.exit(1);
    }
  } catch (error) {
    logger.error("❌ Test cleanup failed", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void testCleanup();
