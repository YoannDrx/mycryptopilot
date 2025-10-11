/**
 * Script: Test Checkout System
 *
 * Teste le système complet de checkout crypto:
 * 1. Génération adresses HD wallet (Base + Tron)
 * 2. Validation format adresses
 * 3. Unicité des adresses générées
 * 4. Persistence en DB
 *
 * Usage:
 *   npx tsx scripts/test-checkout.ts
 */

/* eslint-disable no-console */

import {
  deriveBaseAddress,
  deriveTronAddress,
} from "@/lib/crypto/address-generator";
import { prisma } from "@/lib/prisma";
import "dotenv/config";

console.log("🧪 Test du système de checkout crypto...\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// =============================================================================
// 1. TEST ENVIRONMENT VARIABLES
// =============================================================================
async function testEnvVars() {
  console.log("📋 ÉTAPE 1: Vérification variables d'environnement");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const requiredVars = [
    "BASE_RPC_URL",
    "TRON_RPC_URL",
    "CRYPTO_XPUB_BASE",
    "CRYPTO_XPUB_TRON",
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.error(`❌ ${varName} not configured`);
      allPresent = false;
    } else {
      const preview = `${value.substring(0, 30)  }...`;
      console.log(`✅ ${varName}: ${preview}`);
    }
  }

  console.log("");
  return allPresent;
}

// =============================================================================
// 2. TEST BASE ADDRESS GENERATION
// =============================================================================
async function testBaseAddressGeneration() {
  console.log("📘 ÉTAPE 2: Test génération adresses Base");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Générer 3 adresses avec indexes différents
    const addresses = await Promise.all([
      deriveBaseAddress(0),
      deriveBaseAddress(1),
      deriveBaseAddress(2),
    ]);

    console.log("Adresses générées:");
    addresses.forEach((addr, i) => {
      console.log(`  [${i}] ${addr}`);
    });

    // Vérifications
    const checks = [
      {
        name: "Format 0x...",
        pass: addresses.every((a) => a.startsWith("0x")),
      },
      {
        name: "Longueur 42 chars",
        pass: addresses.every((a) => a.length === 42),
      },
      {
        name: "Hexadecimal valide",
        pass: addresses.every((a) => /^0x[0-9a-fA-F]{40}$/.test(a)),
      },
      {
        name: "Adresses uniques",
        pass: new Set(addresses).size === addresses.length,
      },
    ];

    console.log("\nVérifications:");
    let allPassed = true;
    for (const check of checks) {
      console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
      if (!check.pass) allPassed = false;
    }

    console.log("");
    return allPassed;
  } catch (error) {
    console.error("❌ Erreur génération Base:", error);
    console.log("");
    return false;
  }
}

// =============================================================================
// 3. TEST TRON ADDRESS GENERATION
// =============================================================================
async function testTronAddressGeneration() {
  console.log("🔴 ÉTAPE 3: Test génération adresses Tron");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Générer 3 adresses avec indexes différents
    const addresses = await Promise.all([
      deriveTronAddress(0),
      deriveTronAddress(1),
      deriveTronAddress(2),
    ]);

    console.log("Adresses générées:");
    addresses.forEach((addr, i) => {
      console.log(`  [${i}] ${addr}`);
    });

    // Vérifications
    const checks = [
      {
        name: "Format T...",
        pass: addresses.every((a) => a.startsWith("T")),
      },
      {
        name: "Longueur 34 chars",
        pass: addresses.every((a) => a.length === 34),
      },
      {
        name: "Base58 valide",
        pass: addresses.every((a) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)),
      },
      {
        name: "Adresses uniques",
        pass: new Set(addresses).size === addresses.length,
      },
    ];

    console.log("\nVérifications:");
    let allPassed = true;
    for (const check of checks) {
      console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
      if (!check.pass) allPassed = false;
    }

    console.log("");
    return allPassed;
  } catch (error) {
    console.error("❌ Erreur génération Tron:", error);
    console.log("");
    return false;
  }
}

// =============================================================================
// 4. TEST DATABASE PERSISTENCE
// =============================================================================
async function testDatabasePersistence() {
  console.log("💾 ÉTAPE 4: Test persistence en base de données");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Récupérer un user de test
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: "@" },
      },
    });

    if (!testUser) {
      console.error("❌ Aucun user trouvé en DB pour test");
      console.log("   Créer un account d'abord sur http://localhost:3000\n");
      return false;
    }

    console.log(`User test: ${testUser.email} (${testUser.id})`);

    // Compter adresses existantes
    const existingAddresses = await prisma.cryptoAddress.count({
      where: { userId: testUser.id },
    });

    console.log(`Adresses existantes: ${existingAddresses}`);

    // Générer adresses
    const baseAddress = await deriveBaseAddress(existingAddresses);
    const tronAddress = await deriveTronAddress(existingAddresses);

    console.log(`\nNouvelles adresses générées:`);
    console.log(`  Base: ${baseAddress}`);
    console.log(`  Tron: ${tronAddress}`);

    // Créer records en DB
    const [baseRecord, tronRecord] = await Promise.all([
      prisma.cryptoAddress.create({
        data: {
          userId: testUser.id,
          network: "BASE",
          address: baseAddress,
          derivationPath: `m/44'/60'/0'/0/${existingAddresses}`,
        },
      }),
      prisma.cryptoAddress.create({
        data: {
          userId: testUser.id,
          network: "TRON",
          address: tronAddress,
          derivationPath: `m/44'/195'/0'/0/${existingAddresses}`,
        },
      }),
    ]);

    console.log(`\n✅ Records créés en DB:`);
    console.log(`  Base ID: ${baseRecord.id}`);
    console.log(`  Tron ID: ${tronRecord.id}`);

    // Vérifier unicité
    const duplicates = await prisma.cryptoAddress.groupBy({
      by: ["address"],
      having: {
        address: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    if (duplicates.length > 0) {
      console.error(`\n❌ Adresses dupliquées trouvées: ${duplicates.length}`);
      console.log("");
      return false;
    }

    console.log(`\n✅ Aucune adresse dupliquée`);
    console.log("");
    return true;
  } catch (error) {
    console.error("❌ Erreur persistence DB:", error);
    console.log("");
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// =============================================================================
// 5. RUN ALL TESTS
// =============================================================================
async function main() {
  const step1 = await testEnvVars();
  if (!step1) {
    console.log("❌ Test échoué à l'étape 1");
    console.log(
      "   Configurer les variables d'environnement dans .env.local\n",
    );
    process.exit(1);
  }

  const step2 = await testBaseAddressGeneration();
  if (!step2) {
    console.log("❌ Test échoué à l'étape 2");
    console.log("   Vérifier CRYPTO_XPUB_BASE dans .env.local\n");
    process.exit(1);
  }

  const step3 = await testTronAddressGeneration();
  if (!step3) {
    console.log("❌ Test échoué à l'étape 3");
    console.log("   Vérifier CRYPTO_XPUB_TRON dans .env.local\n");
    process.exit(1);
  }

  const step4 = await testDatabasePersistence();
  if (!step4) {
    console.log("❌ Test échoué à l'étape 4");
    console.log("   Vérifier la connexion DB\n");
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ TOUS LES TESTS PASSENT! 🎉\n");
  console.log("Le système de checkout crypto est opérationnel!\n");
  console.log("Prochaines étapes:");
  console.log(
    "  1. Tester manuellement: http://localhost:3000/orgs/[slug]/checkout/pro",
  );
  console.log("  2. Vérifier QR codes et countdown timer");
  console.log("  3. Tester payment detection avec testnet tokens\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erreur inattendue:", error);
  process.exit(1);
});
