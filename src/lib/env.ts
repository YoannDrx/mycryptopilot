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
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_AUDIENCE_ID: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(), // Legacy - non utilisé (MyCryptoPilot utilise crypto payments)
    NODE_ENV: z.enum(["development", "production", "test"]),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    // Crypto payment configuration
    BASE_RPC_URL: z.string().url().optional(),
    TRON_RPC_URL: z.string().url().optional(),
    CRYPTO_XPUB_BASE: z.string().optional(),
    CRYPTO_XPUB_TRON: z.string().optional(),
  },
  /**
   * If you add `client` environment variables, you need to add them to
   * `experimental__runtimeEnv` as well.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(), // Legacy - non utilisé
    NEXT_PUBLIC_EMAIL_CONTACT: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
  },
});
