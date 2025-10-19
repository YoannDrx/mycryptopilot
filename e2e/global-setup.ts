import { cleanupOrphanedData } from "./utils/cleanup";
import { logger } from "@/lib/logger";

/**
 * Global setup runs BEFORE all tests
 * Cleans up orphaned data to ensure test stability
 */
async function globalSetup() {
  logger.info("🧹 Running global setup - cleaning orphaned data...");

  try {
    const deletedCount = await cleanupOrphanedData();
    logger.info(
      `✅ Global setup complete - cleaned ${deletedCount} orphaned records`,
    );
  } catch (error) {
    logger.error("❌ Global setup failed", error);
    throw error;
  }
}

export default globalSetup;
