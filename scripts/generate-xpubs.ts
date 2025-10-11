/**
 * Script: Génération XPUB Keys pour HD Wallet
 *
 * Génère des Extended Public Keys (xpub) pour Base et Tron.
 * Ces clés permettent de générer des adresses de réception uniques
 * pour chaque user sans exposer les clés privées.
 *
 * ⚠️ SÉCURITÉ:
 * - Exécuter HORS de production
 * - Ne JAMAIS commit les seed phrases
 * - Sauvegarder les seeds dans un vault sécurisé (1Password, Bitwarden, etc.)
 * - Utiliser des wallets DIFFÉRENTS pour dev et production
 *
 * Usage:
 *   npx tsx scripts/generate-xpubs.ts
 *
 * @see docs/CRYPTO_PAYMENT_SETUP.md
 */

/* eslint-disable no-console */

import { HDNodeWallet, Mnemonic } from "ethers";
import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

console.log("🔐 Génération de nouveaux wallets HD pour MyCryptoPilot...\n");
console.log("⚠️  Ces wallets sont NOUVEAUX et n'ont jamais été utilisés.\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// =============================================================================
// 1. GÉNÉRER BASE WALLET (USDC - Ethereum/EVM)
// =============================================================================
console.log("📘 BASE NETWORK (USDC - Ethereum L2)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Générer une seed phrase de 12 mots (128 bits d'entropie)
const baseMnemonic = Mnemonic.fromEntropy(
  crypto.getRandomValues(new Uint8Array(16)),
);

// Dériver le wallet avec le path BIP-44 Ethereum: m/44'/60'/0'/0
const baseWallet = HDNodeWallet.fromMnemonic(baseMnemonic, "m/44'/60'/0'/0");

// Extraire l'extended public key (xpub)
const baseXpub = baseWallet.extendedKey;

// Générer quelques adresses d'exemple pour vérification
const baseAddresses = [
  baseWallet.deriveChild(0).address, // Index 0
  baseWallet.deriveChild(1).address, // Index 1
  baseWallet.deriveChild(2).address, // Index 2
];

console.log("Seed Phrase (12 mots):");
console.log(`  "${baseMnemonic.phrase}"`);
console.log("");
console.log("Derivation Path:");
console.log("  m/44'/60'/0'/0/{index}");
console.log("");
console.log("Extended Public Key (XPUB):");
console.log(`  ${baseXpub}`);
console.log("");
console.log("Exemples d'adresses dérivées:");
baseAddresses.forEach((addr, i) => {
  console.log(`  [${i}] ${addr}`);
});
console.log("");

// =============================================================================
// 2. GÉNÉRER TRON WALLET (USDT - TRC-20)
// =============================================================================
console.log("🔴 TRON NETWORK (USDT - TRC-20)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Générer une seed phrase de 12 mots (128 bits)
const tronMnemonic = generateMnemonic(wordlist);

// Convertir en seed (512 bits)
const tronSeed = mnemonicToSeedSync(tronMnemonic);

// Dériver le master key
const tronMaster = HDKey.fromMasterSeed(tronSeed);

// Dériver avec le path BIP-44 Tron: m/44'/195'/0'/0
const tronAccount = tronMaster.derive("m/44'/195'/0'/0");

// Extraire l'extended public key (xpub)
const tronXpub = tronAccount.publicExtendedKey;

// Note: Pour générer les adresses Tron (T...), il faudrait utiliser TronWeb
// avec la clé publique. Ici on montre juste l'xpub.
console.log("Seed Phrase (12 mots):");
console.log(`  "${tronMnemonic}"`);
console.log("");
console.log("Derivation Path:");
console.log("  m/44'/195'/0'/0/{index}");
console.log("");
console.log("Extended Public Key (XPUB):");
console.log(`  ${tronXpub}`);
console.log("");
console.log(
  "ℹ️  Note: Les adresses Tron (T...) seront générées automatiquement",
);
console.log("   par le système à partir de cet XPUB.");
console.log("");

// =============================================================================
// 3. INSTRUCTIONS DE SÉCURITÉ
// =============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("⚠️  INSTRUCTIONS DE SÉCURITÉ");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");
console.log("1. SAUVEGARDER LES SEED PHRASES:");
console.log("   ✅ Écrire sur papier et stocker dans un coffre-fort");
console.log(
  "   ✅ Utiliser un password manager chiffré (1Password, Bitwarden)",
);
console.log("   ❌ NE JAMAIS commit dans Git");
console.log("   ❌ NE JAMAIS partager avec qui que ce soit");
console.log("");
console.log("2. LES FONDS PEUVENT ÊTRE RÉCUPÉRÉS:");
console.log("   - Les seed phrases permettent de récupérer les fonds");
console.log("   - Si tu perds les seeds, les fonds sont PERDUS À JAMAIS");
console.log("   - Backup multiple recommandé (2-3 copies en lieux différents)");
console.log("");
console.log("3. SÉPARATION DEV/PRODUCTION:");
console.log("   - Générer des wallets DIFFÉRENTS pour dev et prod");
console.log("   - Ne JAMAIS réutiliser les mêmes XPUB");
console.log("   - En dev: utiliser testnet (Base Sepolia, Tron Nile)");
console.log("");

// =============================================================================
// 4. CONFIGURATION .env.local
// =============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("📝 CONFIGURATION .env.local");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");
console.log("Ajouter ces lignes dans .env.local:");
console.log("");
console.log(`CRYPTO_XPUB_BASE="${baseXpub}"`);
console.log(`CRYPTO_XPUB_TRON="${tronXpub}"`);
console.log("");
console.log("Puis redémarrer le serveur:");
console.log("  pnpm dev");
console.log("");

// =============================================================================
// 5. VÉRIFICATION
// =============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("✅ VÉRIFICATION");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");
console.log("Pour tester que tout fonctionne:");
console.log("");
console.log("1. Naviguer vers la page checkout:");
console.log("   http://localhost:3000/orgs/[slug]/checkout/pro");
console.log("");
console.log("2. Vérifier que les adresses sont générées:");
console.log("   - Base (0x...) ✅");
console.log("   - Tron (T...) ✅");
console.log("");
console.log("3. Envoyer des tokens testnet pour tester le flow:");
console.log("   - Base Sepolia USDC: 49 USDC");
console.log("   - Tron Nile USDT: 49 USDT");
console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("✨ Wallets générés avec succès! Happy coding! 🚀\n");
