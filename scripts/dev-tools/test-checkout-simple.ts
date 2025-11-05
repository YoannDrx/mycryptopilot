/**
 * Script: Simple Checkout Test
 *
 * Teste rapidement si le système de génération d'adresses fonctionne
 *
 * Usage:
 *   npx tsx scripts/test-checkout-simple.ts
 */

/* eslint-disable no-console */

import { generateCryptoAddress } from "@/lib/crypto/address-generator";
import { prisma } from "@/lib/prisma";
import "dotenv/config";

async function main() {
  console.log("🧪 Test simple du système de checkout crypto...\n");

  // Get test user
  const testUser = await prisma.user.findFirst({
    where: { email: { contains: "@" } },
  });

  if (!testUser) {
    console.error("❌ Aucun user trouvé en DB pour test");
    console.log("   Créer un account d'abord sur http://localhost:3000\n");
    process.exit(1);
  }

  console.log(`User test: ${testUser.email}`);
  console.log("");

  // Test Base
  console.log("📘 Test Base Network:");
  const baseResult = await generateCryptoAddress(testUser.id, "BASE");
  console.log(`  Adresse: ${baseResult.address}`);
  console.log(`  Path: ${baseResult.derivationPath}`);
  console.log(`  ID: ${baseResult.id}`);
  console.log("");

  // Vérifications Base
  const isValidBase =
    baseResult.address.startsWith("0x") && baseResult.address.length === 42;
  console.log(`  ✅ Format 0x... valide: ${isValidBase}`);
  console.log("");

  // Test Tron
  console.log("🔴 Test Tron Network:");
  const tronResult = await generateCryptoAddress(testUser.id, "TRON");
  console.log(`  Adresse: ${tronResult.address}`);
  console.log(`  Path: ${tronResult.derivationPath}`);
  console.log(`  ID: ${tronResult.id}`);
  console.log("");

  // Vérifications Tron
  const isValidTron =
    tronResult.address.startsWith("T") && tronResult.address.length === 34;
  console.log(`  ✅ Format T... valide: ${isValidTron}`);
  console.log("");

  // Vérifier DB
  const countBase = await prisma.cryptoAddress.count({
    where: { userId: testUser.id, network: "BASE" },
  });
  const countTron = await prisma.cryptoAddress.count({
    where: { userId: testUser.id, network: "TRON" },
  });

  console.log("💾 Adresses en DB:");
  console.log(`  Base: ${countBase} adresse(s)`);
  console.log(`  Tron: ${countTron} adresse(s)`);
  console.log("");

  if (isValidBase && isValidTron) {
    console.log("✅ TOUS LES TESTS PASSENT! 🎉\n");
    console.log("Le système de checkout est prêt à tester:");
    console.log(
      `  http://localhost:3000/orgs/xs5bdkqcimicsnreol2ejlvctou3a20u-f0a7/checkout/pro\n`,
    );
  } else {
    console.log("❌ TESTS ÉCHOUÉS\n");
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
