import { config } from "dotenv";
import { resolve } from "path";

/**
 * Global setup for Playwright tests
 * Loads .env.test.local for local test database configuration
 */
export default async function globalSetup() {
  // Load .env.test.local for local test environment with override
  const envPath = resolve(process.cwd(), ".env.test.local");
  config({ path: envPath, override: true });

  // eslint-disable-next-line no-console
  console.log("✅ Loaded test environment from .env.test.local");
  // eslint-disable-next-line no-console
  console.log(
    `📊 DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`,
  );
}
