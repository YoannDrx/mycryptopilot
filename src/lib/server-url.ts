import { env } from "./env";

/**
 * This method return the server URL based on the environment.
 */
export const getServerUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    return process.env.PLAYWRIGHT_TEST_BASE_URL;
  }

  // Priority 1: Use BETTER_AUTH_URL if explicitly set (for OAuth callbacks)
  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL;
  }

  // Priority 2: If we are in production, we return the production URL.
  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Priority 3: If we are in "stage" environment, we return the staging URL.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 4: If we are in development, we return the localhost URL
  return "http://localhost:3000";
};
