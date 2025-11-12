import { cleanupOrphanedData } from "./utils/cleanup";
import { testLogger } from "./utils/test-logger";

/**
 * Global setup runs BEFORE all tests
 * Cleans up orphaned data to ensure test stability
 */
async function globalSetup() {
  testLogger.info("🧹 Running global setup - cleaning orphaned data...");

  try {
    const deletedCount = await cleanupOrphanedData();
    testLogger.info(
      `✅ Global setup complete - cleaned ${deletedCount} orphaned records`,
    );
  } catch (error) {
    testLogger.error("❌ Global setup failed", error);
    throw error;
  }
}

export default globalSetup;
