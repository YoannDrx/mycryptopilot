/**
 * Script to test crypto address generation
 *
 * This script tests the address-generator module to ensure:
 * - Base addresses are generated correctly
 * - Tron addresses are generated correctly
 * - Addresses are unique per user
 * - Addresses are reused when calling multiple times for same user
 *
 * Usage:
 *   npx tsx scripts/test-address-generation.ts
 */

/* eslint-disable no-console */
// Load environment variables from .env.local
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  generateCryptoAddress,
  getUserCryptoAddresses,
} from "../src/lib/crypto/address-generator";
import { prisma } from "../src/lib/prisma";

console.log("🧪 Testing Crypto Address Generation\n");

async function runTests() {
  try {
    // Clean up test data first
    console.log("🧹 Cleaning up previous test data...");
    await prisma.cryptoAddress.deleteMany({
      where: {
        OR: [
          { userId: { startsWith: "test_" } },
          { address: { contains: "PLACEHOLDER" } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { startsWith: "test_" },
      },
    });
    console.log("✅ Cleanup complete\n");

    // Create test users
    console.log("👤 Creating test users...");
    const now = new Date();
    const testUser1 = await prisma.user.create({
      data: {
        id: "test_user_1",
        name: "Test User 1",
        email: "test1@example.com",
        emailVerified: false,
        userRole: "USER",
        createdAt: now,
        updatedAt: now,
      },
    });
    const testUser2Id = "test_user_2";
    await prisma.user.create({
      data: {
        id: testUser2Id,
        name: "Test User 2",
        email: "test2@example.com",
        emailVerified: false,
        userRole: "USER",
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log("✅ Test users created\n");

    // Test 1: Generate Base address
    console.log("📍 Test 1: Generate Base address");
    const testUser1Id = testUser1.id;
    const baseAddress = await generateCryptoAddress(testUser1Id, "BASE");
    console.log(`✅ Base address generated: ${baseAddress.address}`);
    console.log(`   Derivation path: ${baseAddress.derivationPath}`);
    console.log(`   User ID: ${baseAddress.userId}\n`);

    // Validate Base address format
    if (
      !baseAddress.address.startsWith("0x") ||
      baseAddress.address.length !== 42
    ) {
      throw new Error(`Invalid Base address format: ${baseAddress.address}`);
    }
    console.log("✅ Base address format is valid\n");

    // Test 2: Generate Tron address
    console.log("📍 Test 2: Generate Tron address");
    const tronAddress = await generateCryptoAddress(testUser1Id, "TRON");
    console.log(`✅ Tron address generated: ${tronAddress.address}`);
    console.log(`   Derivation path: ${tronAddress.derivationPath}`);
    console.log(`   User ID: ${tronAddress.userId}\n`);

    // Validate Tron address format
    if (
      !tronAddress.address.startsWith("T") ||
      tronAddress.address.length < 30
    ) {
      throw new Error(`Invalid Tron address format: ${tronAddress.address}`);
    }
    console.log("✅ Tron address format is valid\n");

    // Test 3: Verify address reuse
    console.log("📍 Test 3: Verify address reuse for same user");
    const baseAddress2 = await generateCryptoAddress(testUser1Id, "BASE");
    if (baseAddress2.address !== baseAddress.address) {
      throw new Error("Address should be reused for same user!");
    }
    console.log(`✅ Address correctly reused: ${baseAddress2.address}\n`);

    // Test 4: Verify unique addresses for different users
    console.log("📍 Test 4: Verify unique addresses for different users");
    const baseAddress3 = await generateCryptoAddress(testUser2Id, "BASE");
    if (baseAddress3.address === baseAddress.address) {
      throw new Error("Different users should get different addresses!");
    }
    console.log(`✅ User 1 Base: ${baseAddress.address}`);
    console.log(`✅ User 2 Base: ${baseAddress3.address}`);
    console.log("✅ Addresses are unique per user\n");

    // Test 5: Get all user addresses
    console.log("📍 Test 5: Get all addresses for user");
    const user1Addresses = await getUserCryptoAddresses(testUser1Id);
    console.log(`✅ User 1 has ${user1Addresses.length} addresses:`);
    user1Addresses.forEach((addr) => {
      console.log(`   - ${addr.network}: ${addr.address}`);
    });
    console.log();

    // Summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🎉 All tests passed!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n✅ Address generation is working correctly!");
    console.log("✅ Base (Ethereum) addresses are valid");
    console.log("✅ Tron addresses are valid");
    console.log("✅ Address reuse is working");
    console.log("✅ Unique addresses per user\n");

    // Cleanup
    console.log("🧹 Cleaning up test data...");
    await prisma.cryptoAddress.deleteMany({
      where: {
        userId: { startsWith: "test_" },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { startsWith: "test_" },
      },
    });
    console.log("✅ Test data cleaned up");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

void runTests();
