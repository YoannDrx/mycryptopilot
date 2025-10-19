import { prisma } from "@/lib/prisma";
import { cleanupOrphanedData } from "./utils/cleanup";
import { logger } from "@/lib/logger";

/**
 * Global teardown runs AFTER all tests
 * Cleans up test users and orphaned data
 */
async function globalTeardown() {
  logger.info("🧹 Running global teardown...");

  try {
    // 1. Delete test users (cascade will handle related data)
    const count = await prisma.user.deleteMany({
      where: {
        email: {
          contains: "playwright-test-",
        },
      },
    });
    logger.info(`✅ Deleted ${count.count} test users`);

    // 2. Clean up any orphaned data that might remain
    const orphanedCount = await cleanupOrphanedData();
    logger.info(
      `✅ Global teardown complete - cleaned ${orphanedCount} orphaned records`,
    );
  } catch (error) {
    logger.error("❌ Global teardown failed", error);
    throw error;
  }
}

export default globalTeardown;
