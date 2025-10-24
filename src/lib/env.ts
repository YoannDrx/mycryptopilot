/**
 * This is the schema for the environment variables.
 *
 * Please import **this** file and use the `env` variable
 */

// Type for test environment that matches the expected env structure
type TestEnv = {
  // Database
  DATABASE_URL: string;
  DATABASE_URL_UNPOOLED?: string;
  // Auth
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET: string;
  // OAuth Providers
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  // Email
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID?: string;
  EMAIL_FROM: string;
  // Stripe (legacy - kept for NOW.TS compatibility)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  // Environment
  NODE_ENV: "development" | "production" | "test";
  // Crypto payment configuration
  CRYPTO_NETWORK?: "mainnet" | "testnet";
  BASE_RPC_URL?: string;
  TRON_RPC_URL?: string;
  BASE_RPC_URL_TESTNET?: string;
  TRON_RPC_URL_TESTNET?: string;
  CRYPTO_XPUB_BASE?: string;
  CRYPTO_XPUB_TRON?: string;
  // Binance sweep wallets
  BINANCE_MASTER_WALLET_BASE?: string;
  BINANCE_MASTER_WALLET_TRON?: string;
  // Binance/Bybit API keys (for portfolio tracking - dev only)
  BINANCE_USER_API_KEY?: string;
  BINANCE_USER_SECRET_KEY?: string;
  BYBIT_USER_API_KEY?: string;
  BYBIT_USER_SECRET_KEY?: string;
  // Discord Bot
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_BOT_ENABLED?: "true" | "false";
  DISCORD_INVITE_URL?: string;
  // Discord Channels
  DISCORD_FREE_SIGNALS_CHANNEL_ID?: string;
  DISCORD_LOG_CHANNEL_ID?: string;
  // Discord Roles
  DISCORD_ROLE_ADMIN_ID?: string;
  DISCORD_FREE_ROLE_ID?: string;
  DISCORD_PRO_ROLE_ID?: string;
  DISCORD_ULTRA_ROLE_ID?: string;
  // Discord Webhook
  DISCORD_WEBHOOK_SIGNALS_URL?: string;
  // Cron & Encryption
  CRON_SECRET?: string;
  ENCRYPTION_SECRET: string;
  // Public vars
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
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
      // Database
      DATABASE_URL: z.string().url(),
      DATABASE_URL_UNPOOLED: z.string().url().optional(),
      // Auth
      BETTER_AUTH_URL: z.string().url().optional(),
      BETTER_AUTH_SECRET: z.string().min(1),
      // OAuth Providers
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      DISCORD_CLIENT_ID: z.string().optional(),
      DISCORD_CLIENT_SECRET: z.string().optional(),
      // Email
      RESEND_API_KEY: z.string().min(1),
      RESEND_AUDIENCE_ID: z.string().optional(),
      EMAIL_FROM: z.string().min(1),
      // Stripe (legacy - kept for NOW.TS compatibility, not used in MyCryptoPilot)
      STRIPE_SECRET_KEY: z.string().optional(),
      STRIPE_WEBHOOK_SECRET: z.string().optional(),
      // Environment
      NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
      // Crypto payment configuration
      CRYPTO_NETWORK: z
        .enum(["mainnet", "testnet"])
        .optional()
        .default("testnet"),
      // RPC URLs (mainnet and testnet)
      BASE_RPC_URL: z.string().url().optional(),
      TRON_RPC_URL: z.string().url().optional(),
      BASE_RPC_URL_TESTNET: z.string().url().optional(),
      TRON_RPC_URL_TESTNET: z.string().url().optional(),
      // HD Wallet XPUBs (use different values in .env vs .env.local)
      CRYPTO_XPUB_BASE: z.string().optional(),
      CRYPTO_XPUB_TRON: z.string().optional(),
      // Binance master wallets for sweep
      BINANCE_MASTER_WALLET_BASE: z.string().optional(),
      BINANCE_MASTER_WALLET_TRON: z.string().optional(),
      // Binance/Bybit API keys (for portfolio tracking - dev/test only, readonly)
      BINANCE_USER_API_KEY: z.string().optional(),
      BINANCE_USER_SECRET_KEY: z.string().optional(),
      BYBIT_USER_API_KEY: z.string().optional(),
      BYBIT_USER_SECRET_KEY: z.string().optional(),
      // Discord Bot
      DISCORD_BOT_TOKEN: z.string().optional(),
      DISCORD_GUILD_ID: z.string().optional(),
      DISCORD_BOT_ENABLED: z
        .enum(["true", "false"])
        .optional()
        .default("false"),
      DISCORD_INVITE_URL: z.string().url().optional(),
      // Discord Channels
      DISCORD_FREE_SIGNALS_CHANNEL_ID: z.string().optional(),
      DISCORD_LOG_CHANNEL_ID: z.string().optional(),
      // Discord Roles
      DISCORD_ROLE_ADMIN_ID: z.string().optional(),
      DISCORD_FREE_ROLE_ID: z.string().optional(),
      DISCORD_PRO_ROLE_ID: z.string().optional(),
      DISCORD_ULTRA_ROLE_ID: z.string().optional(),
      // Discord Webhook
      DISCORD_WEBHOOK_SIGNALS_URL: z.string().url().optional(),
      // Cron Jobs
      CRON_SECRET: z.string().optional(),
      // Encryption for sensitive data (API keys in database)
      ENCRYPTION_SECRET: z.string().min(32),
    },
    /**
     * If you add `client` environment variables, you need to add them to
     * `experimental__runtimeEnv` as well.
     */
    client: {
      // App URL (public)
      NEXT_PUBLIC_APP_URL: z.string().url().optional(),
      // Stripe (legacy - kept for NOW.TS compatibility)
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
      // Email contact (public)
      NEXT_PUBLIC_EMAIL_CONTACT: z.string().min(1),
    },
    experimental__runtimeEnv: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
    },
  });
}

export const env =
  process.env.NODE_ENV === "test" ? createTestEnv() : createProductionEnv();
