/**
 * Encryption Verification Script
 *
 * Diagnostic tool to test encryption/decryption setup and identify issues.
 *
 * Use cases:
 * - Verify ENCRYPTION_SECRET is properly configured
 * - Test encryption/decryption cycle
 * - Diagnose "Data integrity check failed" errors
 * - Check if environment variables changed between encryption and decryption
 *
 * Usage:
 * ```bash
 * npx tsx scripts/verify-encryption.ts
 * ```
 */

/* eslint-disable no-console */

import { PrismaClient } from "@/generated/prisma";
import {
  encryptApiKey,
  decryptApiKey,
  verifyEncryptionSetup,
} from "../src/lib/crypto/encryption-service";
import { env } from "../src/lib/env";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Encryption Verification Tool\n");
  console.log("================================\n");

  // Step 1: Check ENCRYPTION_SECRET
  console.log("1️⃣ Checking ENCRYPTION_SECRET environment variable...");
  const secret = env.ENCRYPTION_SECRET;

  if (!secret) {
    console.error("❌ ENCRYPTION_SECRET is not defined!");
    console.error(
      "   Set it in your .env.local: ENCRYPTION_SECRET=your-secret-here",
    );
    console.error("   Generate one with: openssl rand -hex 32");
    process.exit(1);
  }

  console.log(`✅ ENCRYPTION_SECRET is set (${secret.length} characters)`);

  if (secret.length < 32) {
    console.warn(
      `⚠️  WARNING: Secret is too short (${secret.length} chars, minimum 32 recommended)`,
    );
  }

  console.log("");

  // Step 2: Test encryption/decryption cycle
  console.log("2️⃣ Testing encryption/decryption cycle...");
  try {
    const result = verifyEncryptionSetup();

    if (result) {
      console.log("✅ Encryption/decryption cycle works correctly");
    } else {
      console.error("❌ Encryption/decryption cycle failed!");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error testing encryption:", error);
    process.exit(1);
  }

  console.log("");

  // Step 3: Test with real data format
  console.log("3️⃣ Testing with realistic API key format...");
  try {
    const testApiKey =
      "sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const encrypted = encryptApiKey(testApiKey);

    console.log(`   Encrypted data length: ${encrypted.encrypted.length}`);
    console.log(`   IV length: ${encrypted.iv.length}`);
    console.log(`   Auth tag length: ${encrypted.tag.length}`);

    const decrypted = decryptApiKey(
      encrypted.encrypted,
      encrypted.iv,
      encrypted.tag,
    );

    if (decrypted === testApiKey) {
      console.log("✅ Realistic API key encryption works correctly");
    } else {
      console.error("❌ Decrypted data does not match original!");
      console.error(`   Expected: ${testApiKey}`);
      console.error(`   Got: ${decrypted}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error with realistic API key:", error);
    process.exit(1);
  }

  console.log("");

  // Step 4: Check database connections
  console.log("4️⃣ Checking existing encrypted exchange connections...");
  try {
    const connections = await prisma.exchangeConnection.findMany({
      select: {
        id: true,
        exchange: true,
        encryptedApiKey: true,
        keyIv: true,
        keyTag: true,
        isActive: true,
        lastSyncError: true,
        trader: {
          select: {
            displayName: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    if (connections.length === 0) {
      console.log("ℹ️  No exchange connections found in database");
    } else {
      console.log(
        `📊 Found ${connections.length} exchange connection(s) (showing last 10):\n`,
      );

      for (const conn of connections) {
        console.log(`   Connection ID: ${conn.id}`);
        console.log(`   Exchange: ${conn.exchange}`);
        console.log(
          `   User: ${conn.trader.user.name} (${conn.trader.user.email})`,
        );
        console.log(`   Trader: ${conn.trader.displayName}`);
        console.log(`   Active: ${conn.isActive ? "✅" : "❌"}`);

        if (conn.lastSyncError) {
          console.log(`   ⚠️  Last Error: ${conn.lastSyncError}`);
        }

        // Try to decrypt the API key
        try {
          const decrypted = decryptApiKey(
            conn.encryptedApiKey,
            conn.keyIv,
            conn.keyTag,
          );

          // Don't log the actual key, just verify it decrypted
          console.log(
            `   🔓 Decryption: ✅ SUCCESS (key length: ${decrypted.length})`,
          );
        } catch (error) {
          console.log(`   🔓 Decryption: ❌ FAILED`);
          console.log(
            `      Error: ${error instanceof Error ? error.message : "Unknown"}`,
          );

          if (
            error instanceof Error &&
            error.message.includes("Data integrity check failed")
          ) {
            console.log(
              "      💡 This error means the ENCRYPTION_SECRET used to encrypt",
            );
            console.log(
              "         this data is different from your current secret.",
            );
            console.log(
              "         You need to reconnect this exchange with new API keys.",
            );
          }
        }

        console.log("");
      }
    }
  } catch (error) {
    console.error("❌ Error checking database connections:", error);
    process.exit(1);
  }

  // Step 5: Recommendations
  console.log("5️⃣ Recommendations\n");

  console.log("✨ To fix decryption errors:");
  console.log("   1. Verify your ENCRYPTION_SECRET has not changed");
  console.log("   2. Check the secret is the same in all environments");
  console.log("   3. If secret changed, reconnect exchanges with new API keys");
  console.log("   4. Never change ENCRYPTION_SECRET in production!");
  console.log("");
  console.log("📚 For more info, see:");
  console.log("   - .env.example (line 157: ENCRYPTION_SECRET)");
  console.log("   - src/lib/crypto/encryption-service.ts");
  console.log("");

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
