/**
 * This is the schema for the environment variables.
 *
 * Please import **this** file and use the `env` variable
 */

// Type for test environment that matches the expected env structure
type TestEnv = {
  DATABASE_URL: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID?: string;
  EMAIL_FROM: string;
  STRIPE_SECRET_KEY: string;
  NODE_ENV: "development" | "production" | "test";
  STRIPE_WEBHOOK_SECRET?: string;
  BASE_RPC_URL?: string;
  TRON_RPC_URL?: string;
  CRYPTO_XPUB_BASE?: string;
  CRYPTO_XPUB_TRON?: string;
  BINANCE_MASTER_WALLET_BASE?: string;
  BINANCE_MASTER_WALLET_TRON?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_BOT_ENABLED?: "true" | "false";
  DISCORD_FREE_SIGNALS_CHANNEL_ID?: string;
  DISCORD_LOG_CHANNEL_ID?: string;
  DISCORD_ROLE_ADMIN_ID?: string;
  DISCORD_INVITE_URL?: string;
  CRON_SECRET?: string;
  ENCRYPTION_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_EMAIL_CONTACT: string;
};

// In test environment, skip validation to avoid ES Module issues with Playwright
function createTestEnv(): TestEnv {
  return process.env as unknown as TestEnv;
}

function createProductionEnv() {
  // Dynamic require to avoid ES Module issues in test environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createEnv } = require("@t3-oss/env-nextjs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { z } = require("zod");

  return createEnv({
    server: {
      DATABASE_URL: z.string().url(),
      BETTER_AUTH_URL: z.string().url().optional(),
      BETTER_AUTH_SECRET: z.string().min(1),
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      DISCORD_CLIENT_ID: z.string().optional(),
      DISCORD_CLIENT_SECRET: z.string().optional(),
      RESEND_API_KEY: z.string().min(1),
      RESEND_AUDIENCE_ID: z.string().optional(),
      EMAIL_FROM: z.string().min(1),
      STRIPE_SECRET_KEY: z.string().min(1),
      NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
      STRIPE_WEBHOOK_SECRET: z.string().optional(),
      // Crypto payment configuration
      BASE_RPC_URL: z.string().url().optional(),
      TRON_RPC_URL: z.string().url().optional(),
      CRYPTO_XPUB_BASE: z.string().optional(),
      CRYPTO_XPUB_TRON: z.string().optional(),
      // Binance master wallets for sweep (optional)
      BINANCE_MASTER_WALLET_BASE: z.string().optional(),
      BINANCE_MASTER_WALLET_TRON: z.string().optional(),
      // Discord Bot configuration
      DISCORD_BOT_TOKEN: z.string().optional(),
      DISCORD_GUILD_ID: z.string().optional(),
      DISCORD_BOT_ENABLED: z
        .enum(["true", "false"])
        .optional()
        .default("false"),
      DISCORD_FREE_SIGNALS_CHANNEL_ID: z.string().optional(),
      DISCORD_LOG_CHANNEL_ID: z.string().optional(),
      DISCORD_ROLE_ADMIN_ID: z.string().optional(),
      DISCORD_INVITE_URL: z.string().url().optional(), // Permanent invite link for emails
      // Cron Jobs configuration
      CRON_SECRET: z.string().optional(),
      // Encryption for sensitive data (API keys)
      ENCRYPTION_SECRET: z.string().min(32),
    },
    /**
     * If you add `client` environment variables, you need to add them to
     * `experimental__runtimeEnv` as well.
     */
    client: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
      NEXT_PUBLIC_EMAIL_CONTACT: z.string().min(1),
    },
    experimental__runtimeEnv: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
    },
  });
}

export const env =
  process.env.NODE_ENV === "test" ? createTestEnv() : createProductionEnv();
