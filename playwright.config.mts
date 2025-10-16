import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

// Simplified server URL logic for Playwright (no deps on compiled TS files)
function getServerUrl(): string {
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    return process.env.PLAYWRIGHT_TEST_BASE_URL;
  }

  // Priority 1: Vercel preview
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 2: Production
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Priority 3: Localhost
  return "http://localhost:3000";
}

const SERVER_URL = getServerUrl();

const HEADLESS = process.env.HEADLESS
  ? process.env.HEADLESS.toLowerCase() === "true"
  : true;

const config: PlaywrightTestConfig = {
  // 50 seconds
  timeout: 70 * 1000,
  // Expect timeout for assertions (e.g., toBeVisible, toHaveText)
  expect: {
    timeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Add retry options
  retries: 1,
  // Add delay between retries
  workers: 3,
  globalSetup: new URL("./e2e/global-setup.ts", import.meta.url).pathname,
  globalTeardown: new URL("./e2e/global-teardown.ts", import.meta.url).pathname,
  // Enable console logs in CI
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    launchOptions: {
      slowMo: 200,
    },
    headless: HEADLESS,
    contextOptions: {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
      },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    },
    ignoreHTTPSErrors: true,
    video: "on-first-retry",
    baseURL: SERVER_URL,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 2.3488, latitude: 48.8534 },
    permissions: ["geolocation", "clipboard-read", "clipboard-write"],
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  testDir: "e2e",
  // Only start the web server if PLAYWRIGHT_TEST_BASE_URL is not set
  ...(!process.env.PLAYWRIGHT_TEST_BASE_URL
    ? {
        webServer: {
          command: "pnpm run build; pnpm run start",
          url: SERVER_URL,
          timeout: 120 * 1000,
          reuseExistingServer:
            process.env.NODE_ENV === "development" ? !process.env.CI : true,
          env: {
            // Use local test database (Conductor uses macOS username, no password)
            DATABASE_URL: "postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test",
            DATABASE_URL_UNPOOLED: "postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test",
          },
        },
      }
    : {}),
};

export default config;
