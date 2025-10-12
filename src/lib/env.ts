import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * This is the schema for the environment variables.
 *
 * Please import **this** file and use the `env` variable
 */
export const env = createEnv({
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
    DISCORD_BOT_ENABLED: z.enum(["true", "false"]).optional().default("false"),
    DISCORD_FREE_SIGNALS_CHANNEL_ID: z.string().optional(),
    DISCORD_LOG_CHANNEL_ID: z.string().optional(),
    DISCORD_ROLE_ADMIN_ID: z.string().optional(),
    // Cron Jobs configuration
    CRON_SECRET: z.string().optional(),
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
