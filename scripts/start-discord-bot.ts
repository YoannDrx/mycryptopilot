#!/usr/bin/env tsx

/**
 * Script standalone pour démarrer le bot Discord
 *
 * Usage:
 *   pnpm tsx scripts/start-discord-bot.ts
 *
 * Environment variables required:
 *   - DISCORD_BOT_TOKEN
 *   - DISCORD_GUILD_ID
 *   - DISCORD_BOT_ENABLED=true
 */

// Load environment variables BEFORE importing any modules
// IMPORTANT: Only load .env files in development
// In production (Railway/Vercel), variables are injected via platform
import dotenv from "dotenv";
import path from "node:path";

// Only load .env files in non-production environments
if (process.env.NODE_ENV !== "production") {
  const envFile = ".env.development";
  dotenv.config({ path: path.join(process.cwd(), envFile), override: true });
  // eslint-disable-next-line no-console
  console.log(`Loaded environment from ${envFile}`);
} else {
  // eslint-disable-next-line no-console
  console.log(
    "Production mode: Using environment variables from Railway/platform",
  );
}

import { discordBot } from "../src/lib/discord/bot-client";
import { logger } from "../src/lib/logger";

async function main() {
  logger.info("🚀 Starting MyCryptoPilot Discord Bot...");

  // Vérifier si le bot est activé
  if (!discordBot.isEnabled()) {
    logger.error(
      "❌ Discord bot is disabled. Set DISCORD_BOT_ENABLED=true in .env",
    );
    process.exit(1);
  }

  try {
    // Initialiser le bot
    const client = await discordBot.initialize();

    if (!client) {
      logger.error("❌ Failed to initialize Discord bot");
      process.exit(1);
    }

    logger.info(`✅ Discord bot started successfully as ${client.user?.tag}`);
    logger.info("🎮 Bot is ready to receive commands!");

    // Gérer les signaux d'arrêt gracieux
    process.on("SIGINT", async () => {
      logger.info("⏹️  Shutting down Discord bot...");
      await discordBot.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("⏹️  Shutting down Discord bot...");
      await discordBot.shutdown();
      process.exit(0);
    });
  } catch (error) {
    logger.error("❌ Error starting Discord bot:", error);
    process.exit(1);
  }
}

void main();
