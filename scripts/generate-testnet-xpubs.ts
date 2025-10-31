/**
 * Script to generate testnet XPUB keys for Base and Tron
 *
 * IMPORTANT: This script generates TEST KEYS ONLY. Never use these keys for production!
 *
 * Usage:
 *   npx tsx scripts/generate-testnet-xpub.ts
 *
 * The script will output:
 * - CRYPTO_XPUB_BASE for Base/Ethereum testnet
 * - CRYPTO_XPUB_TRON for Tron testnet
 *
 * Add these values to your .env.local file.
 */

/* eslint-disable no-console */
import { Wallet, HDNodeWallet } from "ethers";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";

console.log("🔐 Generating Testnet XPUB Keys\n");
console.log(
  "⚠️  WARNING: These are TEST keys only. DO NOT use in production!\n",
);

// Generate a random mnemonic for testnet
const mnemonic = Wallet.createRandom().mnemonic;

if (!mnemonic) {
  throw new Error("Failed to generate mnemonic");
}

console.log("📝 Generated Mnemonic (SAVE THIS SECURELY):");
console.log(`   ${mnemonic.phrase}\n`);
console.log(
  "⚠️  Keep this mnemonic safe! You'll need it to access the wallets.\n",
);

// ====================================
// Base / Ethereum XPUB (BIP44 path: m/44'/60'/0')
// ====================================

console.log("🟦 Generating Base/Ethereum XPUB...");

const baseHdNode = HDNodeWallet.fromPhrase(mnemonic.phrase);
// Derive to account 0: m/44'/60'/0'
const baseAccountNode = baseHdNode.derivePath("44'/60'/0'");
// Use neuter() to get ONLY the public extended key (xpub), not private (xprv)
const baseXpub = baseAccountNode.neuter().extendedKey;

console.log(`✅ Base XPUB: ${baseXpub}`);
console.log(`   Derivation path: m/44'/60'/0'\n`);

// Test derivation of first address
const baseTestWallet = baseAccountNode.derivePath("0/0");
console.log(`   Test address (index 0): ${baseTestWallet.address}\n`);

// ====================================
// Tron XPUB (BIP44 path: m/44'/195'/0')
// ====================================

console.log("🟣 Generating Tron XPUB...");

// For Tron, we need to use HDKey from @scure/bip32
const seed = mnemonicToSeedSync(mnemonic.phrase);
const tronHdKey = HDKey.fromMasterSeed(seed);
// Derive to account 0: m/44'/195'/0'
const tronAccountKey = tronHdKey.derive("m/44'/195'/0'");

if (!tronAccountKey.publicExtendedKey) {
  throw new Error("Failed to generate Tron xpub");
}

const tronXpub = tronAccountKey.publicExtendedKey;

console.log(`✅ Tron XPUB: ${tronXpub}`);
console.log(`   Derivation path: m/44'/195'/0'\n`);

// ====================================
// Summary - Environment Variables
// ====================================

console.log("═══════════════════════════════════════════════════════════");
console.log("📋 CONFIGURATION - Copier dans .env.local\n");
console.log(`CRYPTO_XPUB_BASE="${baseXpub}"`);
console.log(`CRYPTO_XPUB_TRON="${tronXpub}"`);
console.log("\n═══════════════════════════════════════════════════════════");

console.log("\n🎯 PROCHAINES ÉTAPES:");
console.log(
  "\n1️⃣  Copier les XPUBs ci-dessus dans .env.local (PAS .env.development)",
);
console.log("   → Ouvrir .env.local");
console.log("   → Ajouter CRYPTO_XPUB_BASE et CRYPTO_XPUB_TRON");
console.log("   → Redémarrer le serveur: pnpm dev");

console.log("\n2️⃣  Sauvegarder la mnemonic phrase dans un endroit sûr");
console.log("   → Utiliser un password manager (1Password, Bitwarden)");
console.log("   → ⚠️  Ne JAMAIS commit cette phrase dans Git");

console.log("\n3️⃣  Tester le système de paiement");
console.log("   → Aller sur http://localhost:3000/orgs/[slug]/checkout/pro");
console.log("   → Vérifier que les adresses Base et Tron sont générées");
console.log("   → Obtenir testnet tokens (liens dans la doc)");
console.log("   → Tester un paiement de $1 pour valider le flow");

console.log("\n4️⃣  Pour la production, utiliser un hardware wallet");
console.log("   → Ledger ou Trezor recommandé");
console.log("   → Script production: npm run generate-mainnet-xpubs");
console.log("\n");
