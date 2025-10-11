/**
 * Script to test crypto address generation
 *
 * Tests:
 * 1. Generate Base address for test user
 * 2. Generate Tron address for test user
 * 3. Verify addresses are valid format
 * 4. Verify address reuse (same user gets same address)
 */

/* eslint-disable no-console */
import { generateCryptoAddress } from "@/lib/crypto/address-generator";
import { prisma } from "@/lib/prisma";

async function testAddressGeneration() {
  console.log("🧪 Testing Crypto Address Generation\n");

  // Create a test user if not exists
  let testUser = await prisma.user.findFirst({
    where: {
      email: "test-crypto@mycryptopilot.app",
    },
  });

  if (!testUser) {
    console.log("Creating test user...");
    // Generate a simple test ID
    const testId = `test-user-${Date.now()}`;
    testUser = await prisma.user.create({
      data: {
        id: testId,
        email: "test-crypto@mycryptopilot.app",
        name: "Test Crypto User",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Test user created: ${testUser.id}\n`);
  } else {
    console.log(`✅ Using existing test user: ${testUser.id}\n`);
  }

  // Test 1: Generate Base address
  console.log("1️⃣ Testing Base (USDC) address generation...");
  const baseAddress = await generateCryptoAddress(testUser.id, "BASE");
  console.log(`   Address: ${baseAddress.address}`);
  console.log(`   Path: ${baseAddress.derivationPath}`);

  // Validate Base address format (0x... with 40 hex chars)
  const isValidBase =
    baseAddress.address.startsWith("0x") && baseAddress.address.length === 42;
  console.log(`   Valid: ${isValidBase ? "✅" : "❌"}\n`);

  // Test 2: Generate Tron address
  console.log("2️⃣ Testing Tron (USDT) address generation...");
  const tronAddress = await generateCryptoAddress(testUser.id, "TRON");
  console.log(`   Address: ${tronAddress.address}`);
  console.log(`   Path: ${tronAddress.derivationPath}`);

  // Validate Tron address format (T... with 34 chars)
  const isValidTron =
    tronAddress.address.startsWith("T") && tronAddress.address.length === 34;
  console.log(`   Valid: ${isValidTron ? "✅" : "❌"}\n`);

  // Test 3: Verify address reuse (same user gets same address)
  console.log("3️⃣ Testing address reuse...");
  const baseAddress2 = await generateCryptoAddress(testUser.id, "BASE");
  const addressesMatch = baseAddress.address === baseAddress2.address;
  console.log(
    `   Same address returned: ${addressesMatch ? "✅" : "❌"} (${baseAddress2.address})\n`,
  );

  // Summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 Test Results:");
  console.log(`   Base address valid: ${isValidBase ? "✅" : "❌"}`);
  console.log(`   Tron address valid: ${isValidTron ? "✅" : "❌"}`);
  console.log(`   Address reuse works: ${addressesMatch ? "✅" : "❌"}`);

  if (isValidBase && isValidTron && addressesMatch) {
    console.log("\n✅ All tests passed!");
    console.log("\n🎉 Your crypto payment system is ready!");
    console.log(
      "\nNext steps:\n1. Create UI for checkout page\n2. Implement payment watcher\n3. Test with real testnet transactions",
    );
  } else {
    console.log("\n❌ Some tests failed. Check configuration.");
  }
  console.log("═══════════════════════════════════════════════════════════\n");
}

// Run tests
testAddressGeneration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
