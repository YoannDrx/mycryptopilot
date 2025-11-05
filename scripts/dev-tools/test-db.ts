#!/usr/bin/env tsx
/* eslint-disable no-console */

import {
  CryptoNetwork,
  PaymentStatus,
  PrismaClient,
  UserRole,
} from "@/generated/prisma";

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log("🔍 Testing database connection...\n");

    // Test 1: Check if we can connect
    await prisma.$connect();
    console.log("✅ Database connection successful\n");

    // Test 2: Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    // Test 3: Count trader profiles
    const traderCount = await prisma.traderProfile.count();
    console.log(`📊 Trader profiles: ${traderCount}`);

    // Test 4: Count signals
    const signalCount = await prisma.signal.count();
    console.log(`📊 Signals: ${signalCount}`);

    // Test 5: Count crypto addresses
    const addressCount = await prisma.cryptoAddress.count();
    console.log(`📊 Crypto addresses: ${addressCount}`);

    // Test 6: Count crypto payments
    const paymentCount = await prisma.cryptoPayment.count();
    console.log(`📊 Crypto payments: ${paymentCount}`);

    // Test 7: Count follows
    const followCount = await prisma.follow.count();
    console.log(`📊 Follows: ${followCount}\n`);

    console.log("✅ All MyCryptoPilot models are accessible!\n");

    // Test 8: Verify enums are available
    console.log("🔍 Testing enums...");
    console.log(
      "UserRole enum:",
      Object.keys(UserRole).length > 0 ? "✅" : "N/A",
    );
    console.log(
      "CryptoNetwork enum:",
      Object.keys(CryptoNetwork).length > 0 ? "✅" : "N/A",
    );
    console.log(
      "PaymentStatus enum:",
      Object.keys(PaymentStatus).length > 0 ? "✅" : "N/A",
    );

    console.log("\n✨ Database is fully functional and ready!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void testDatabase();
