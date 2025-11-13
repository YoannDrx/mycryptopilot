#!/usr/bin/env tsx
/**
 * Redis Setup Script - Upstash Configuration
 *
 * Automates Redis URL configuration across all environments:
 * - Local development (.env.local)
 * - Example files (.env.example)
 * - Vercel (instructions)
 * - Fly.io (instructions)
 *
 * Usage:
 *   pnpm tsx scripts/setup-redis.ts
 *
 * Prerequisites:
 *   1. Create Upstash account: https://console.upstash.com/login
 *   2. Create Redis database (regional, eu-west-1, noeviction)
 *   3. Copy Redis URL (rediss://default:[PASSWORD]@[HOST]:6379)
 */

/* eslint-disable no-console */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import * as readline from "readline/promises";

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg: string) =>
    console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg: string) =>
    console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg: string) =>
    console.log(`${colors.bright}${colors.blue}▸${colors.reset} ${msg}`),
};

const PROJECT_ROOT = join(__dirname, "..");
const ENV_LOCAL = join(PROJECT_ROOT, ".env.local");
const ENV_EXAMPLE = join(PROJECT_ROOT, ".env.example");

/**
 * Check if Redis URL is already configured
 */
function checkExistingRedis(): {
  inLocal: boolean;
  inExample: boolean;
  url?: string;
} {
  let inLocal = false;
  let inExample = false;
  let url: string | undefined;

  // Check .env.local
  if (existsSync(ENV_LOCAL)) {
    const content = readFileSync(ENV_LOCAL, "utf-8");
    const match = content.match(/^REDIS_URL=["']?([^"'\n]+)["']?/m);
    if (match) {
      inLocal = true;
      url = match[1];
    }
  }

  // Check .env.example
  if (existsSync(ENV_EXAMPLE)) {
    const content = readFileSync(ENV_EXAMPLE, "utf-8");
    if (content.includes("REDIS_URL=")) {
      inExample = true;
    }
  }

  return { inLocal, inExample, url };
}

/**
 * Validate Redis URL format
 */
function validateRedisUrl(url: string): { valid: boolean; error?: string } {
  // Should be: rediss://default:[PASSWORD]@[HOST]:6379
  // or: redis://[HOST]:6379 (local)

  if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
    return {
      valid: false,
      error: "URL must start with redis:// or rediss://",
    };
  }

  // Check for password in production URLs
  if (url.startsWith("rediss://") && !url.includes("@")) {
    return {
      valid: false,
      error:
        "Production Redis URL should include authentication (default:PASSWORD@)",
    };
  }

  // Check for host
  if (!url.includes(":6379") && !url.includes(":")) {
    return {
      valid: false,
      error: "URL must include port (usually :6379)",
    };
  }

  return { valid: true };
}

/**
 * Add Redis URL to .env.local
 */
function addToEnvLocal(redisUrl: string): void {
  let content = "";

  if (existsSync(ENV_LOCAL)) {
    content = readFileSync(ENV_LOCAL, "utf-8");

    // Replace existing REDIS_URL or add new
    if (content.includes("REDIS_URL=")) {
      content = content.replace(/^REDIS_URL=.*/m, `REDIS_URL="${redisUrl}"`);
      log.info("Updated existing REDIS_URL in .env.local");
    } else {
      // Add at end with section header
      content += `\n# Redis (Upstash) - For SSE pub/sub and BullMQ\nREDIS_URL="${redisUrl}"\n`;
      log.info("Added REDIS_URL to .env.local");
    }
  } else {
    // Create new .env.local
    content = `# Redis (Upstash) - For SSE pub/sub and BullMQ\nREDIS_URL="${redisUrl}"\n`;
    log.info("Created .env.local with REDIS_URL");
  }

  writeFileSync(ENV_LOCAL, content, "utf-8");
  log.success(".env.local updated");
}

/**
 * Add Redis URL placeholder to .env.example
 */
function addToEnvExample(): void {
  if (!existsSync(ENV_EXAMPLE)) {
    log.warn(".env.example not found, skipping");
    return;
  }

  let content = readFileSync(ENV_EXAMPLE, "utf-8");

  if (content.includes("REDIS_URL=")) {
    log.info("REDIS_URL already in .env.example");
    return;
  }

  // Add at end with section header
  content += `\n# Redis (Upstash) - For SSE pub/sub and BullMQ\n# Get from: https://console.upstash.com/redis\n# Format: rediss://default:PASSWORD@your-redis.upstash.io:6379\nREDIS_URL="rediss://default:YOUR_PASSWORD@your-redis.upstash.io:6379"\n`;

  writeFileSync(ENV_EXAMPLE, content, "utf-8");
  log.success(".env.example updated with REDIS_URL placeholder");
}

/**
 * Test Redis connection
 */
async function testConnection(redisUrl: string): Promise<boolean> {
  try {
    // Dynamically import ioredis to avoid require() issues
    const { default: Redis } = await import("ioredis");

    log.info("Testing Redis connection...");

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });

    await redis.ping();

    await redis.quit();

    log.success("Redis connection successful!");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Connection failed: ${error.message}`);

      // Provide helpful error messages
      if (error.message.includes("ENOTFOUND")) {
        log.warn("  → Check if Redis host is correct");
      } else if (error.message.includes("ECONNREFUSED")) {
        log.warn("  → Redis server may not be running or port is wrong");
      } else if (error.message.includes("NOAUTH")) {
        log.warn("  → Authentication failed - check password");
      } else if (error.message.includes("SSL")) {
        log.warn("  → SSL error - try changing rediss:// to redis://");
      }
    }
    return false;
  }
}

/**
 * Display next steps for Vercel and Fly
 */
function displayNextSteps(redisUrl: string): void {
  console.log(
    `\n${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.green}  ✓ Redis Setup Complete - Next Steps:${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
  );

  // Vercel
  console.log(`${colors.bright}📦 Vercel (Production):${colors.reset}`);
  console.log(`   1. Via Dashboard:`);
  console.log(
    `      → https://vercel.com/[YOUR_TEAM]/mycryptopilot/settings/environment-variables`,
  );
  console.log(`      → Add variable: REDIS_URL`);
  console.log(`      → Value: ${colors.cyan}${redisUrl}${colors.reset}`);
  console.log(`      → Environment: Production\n`);

  console.log(`   2. Via CLI:`);
  console.log(
    `      ${colors.cyan}echo "${redisUrl}" | vercel env add REDIS_URL production${colors.reset}\n`,
  );

  // Fly.io
  console.log(`${colors.bright}🪰 Fly.io Worker:${colors.reset}`);
  console.log(
    `   ${colors.cyan}fly secrets set REDIS_URL="${redisUrl}" -a mycryptopilot-worker${colors.reset}\n`,
  );

  console.log(`   Verify secrets:`);
  console.log(
    `   ${colors.cyan}fly secrets list -a mycryptopilot-worker${colors.reset}\n`,
  );

  // Redeploy
  console.log(`${colors.bright}🚀 Redeploy:${colors.reset}`);
  console.log(`   Vercel: Automatic on next git push to main`);
  console.log(
    `   Fly.io: ${colors.cyan}pnpm worker:deploy${colors.reset} (or ${colors.cyan}fly deploy --config fly.worker.toml --ha=false${colors.reset})\n`,
  );

  // Documentation
  console.log(`${colors.bright}📚 Documentation:${colors.reset}`);
  console.log(
    `   Full guide: ${colors.cyan}.claude/docs/REDIS-SETUP.md${colors.reset}\n`,
  );

  console.log(
    `${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
  );
}

/**
 * Main setup flow
 */
async function main(): Promise<void> {
  console.log(
    `${colors.bright}${colors.blue}🔴 Redis Setup - Upstash Configuration${colors.reset}\n`,
  );

  // Step 1: Check existing configuration
  log.step("Checking existing Redis configuration...");
  const existing = checkExistingRedis();

  if (existing.inLocal && existing.url) {
    log.warn(`Redis URL already configured in .env.local:`);
    console.log(
      `   ${colors.cyan}${existing.url.substring(0, 50)}...${colors.reset}\n`,
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await rl.question(
      `${colors.yellow}Replace existing configuration? (y/n):${colors.reset} `,
    );

    rl.close();

    if (answer.toLowerCase() !== "y") {
      log.info("Setup cancelled");
      return;
    }
  }

  // Step 2: Get Redis URL
  log.step("Enter Redis URL from Upstash console");
  console.log(
    `   ${colors.cyan}Format: rediss://default:PASSWORD@your-redis.upstash.io:6379${colors.reset}`,
  );
  console.log(
    `   ${colors.cyan}Get it from: https://console.upstash.com/redis${colors.reset}\n`,
  );

  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const redisUrl = await rl2.question(
    `${colors.yellow}REDIS_URL:${colors.reset} `,
  );

  rl2.close();

  if (!redisUrl.trim()) {
    log.error("Redis URL is required");
    process.exit(1);
  }

  // Step 3: Validate URL
  log.step("Validating Redis URL format...");
  const validation = validateRedisUrl(redisUrl.trim());

  if (!validation.valid) {
    log.error(`Invalid Redis URL: ${validation.error}`);
    process.exit(1);
  }

  log.success("URL format valid");

  // Step 4: Test connection
  const connected = await testConnection(redisUrl.trim());

  if (!connected) {
    log.error(
      "Connection test failed - but continuing with configuration anyway",
    );
    log.warn("You may need to fix connection issues later");
  }

  // Step 5: Add to .env.local
  log.step("Updating .env.local...");
  addToEnvLocal(redisUrl.trim());

  // Step 6: Add to .env.example
  log.step("Updating .env.example...");
  addToEnvExample();

  // Step 7: Display next steps
  displayNextSteps(redisUrl.trim());

  log.success("Phase 1.3a complete! ✅");
}

// Run script
main().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
