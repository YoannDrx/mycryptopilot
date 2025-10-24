/**
 * Script: Génération XPUB Keys PRODUCTION pour HD Wallet
 *
 * ⚠️ PRODUCTION ONLY - Génère des VRAIS wallets pour recevoir de l'argent réel!
 *
 * Génère des Extended Public Keys (xpub) pour Base et Tron avec 24 mots (256 bits).
 * Ces clés permettent de générer des adresses de réception uniques pour chaque user
 * sans exposer les clés privées.
 *
 * ⚠️ SÉCURITÉ CRITIQUE:
 * - Les seed phrases générées contrôlent de L'ARGENT RÉEL
 * - Perte de seed = PERTE TOTALE ET IRRÉVERSIBLE DES FONDS
 * - Ne JAMAIS commit les seed phrases dans Git
 * - Sauvegarder dans un vault sécurisé (1Password, Bitwarden, coffre-fort)
 * - Utiliser des wallets DIFFÉRENTS pour dev (testnet) et production
 *
 * Usage:
 *   npx tsx scripts/generate-mainnet-xpubs.ts
 *
 * Configuration:
 *   Les XPUBs générés doivent être ajoutés dans VERCEL DASHBOARD (Production scope),
 *   PAS dans .env.local ou .env.production (fichiers locaux).
 */

/* eslint-disable no-console */

import { HDNodeWallet, Mnemonic } from "ethers";
import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

async function main() {
  console.log(
    "🔐 Génération de nouveaux wallets HD pour MyCryptoPilot PRODUCTION\n",
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    "⚠️  ATTENTION: Ceci va générer des VRAIS wallets pour la PRODUCTION!",
  );
  console.log("⚠️  Ces wallets vont recevoir de L'ARGENT RÉEL de vos clients!");
  console.log("⚠️  La perte de la seed phrase = PERTE TOTALE DES FONDS!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("⏸️  Le script va démarrer dans 5 secondes...\n");

  // Pause de sécurité pour que l'utilisateur puisse annuler
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // =============================================================================
  // 1. GÉNÉRER BASE WALLET (USDC - Ethereum/EVM)
  // =============================================================================
  console.log("📘 BASE NETWORK (USDC - Ethereum L2)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Générer une seed phrase de 24 mots (256 bits d'entropie - PRODUCTION)
  // 24 mots = beaucoup plus sécurisé que 12 mots pour des fonds de production
  const baseMnemonic = Mnemonic.fromEntropy(
    crypto.getRandomValues(new Uint8Array(32)), // 32 bytes = 256 bits = 24 mots
  );

  // Dériver le wallet avec le path BIP-44 Ethereum: m/44'/60'/0'/0
  const baseWallet = HDNodeWallet.fromMnemonic(baseMnemonic, "m/44'/60'/0'/0");

  // Extraire l'extended public key (xpub) - .neuter() retire les clés privées!
  const baseXpub = baseWallet.neuter().extendedKey; // ← CRITICAL: .neuter() = xpub uniquement!

  // Générer quelques adresses d'exemple pour vérification
  const baseAddresses = [
    baseWallet.deriveChild(0).address, // Index 0
    baseWallet.deriveChild(1).address, // Index 1
    baseWallet.deriveChild(2).address, // Index 2
  ];

  console.log("🔑 Seed Phrase (24 mots - SAUVEGARDER IMMÉDIATEMENT!):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`"${baseMnemonic.phrase}"`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("⚠️  COPIER CETTE PHRASE MAINTENANT!");
  console.log("   1. Écrire sur papier dans un coffre-fort");
  console.log("   2. Sauvegarder dans password manager (1Password, Bitwarden)");
  console.log("   3. JAMAIS dans Git, JAMAIS en clair sur l'ordinateur");
  console.log("");
  console.log("⏸️  Pause de 30 secondes pour sauvegarder...\n");

  // Pause longue pour sauvegarder la seed phrase
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log(
    "✅ Continuation (vous avez sauvegardé la seed phrase, n'est-ce pas?)\n",
  );

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

  // Générer une seed phrase de 24 mots (256 bits - PRODUCTION)
  const tronMnemonic = generateMnemonic(wordlist, 256); // 256 bits = 24 mots

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
  console.log("🔑 Seed Phrase (24 mots - SAUVEGARDER IMMÉDIATEMENT!):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`"${tronMnemonic}"`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("⚠️  COPIER CETTE PHRASE MAINTENANT!");
  console.log("");
  console.log("⏸️  Pause de 30 secondes pour sauvegarder...\n");

  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log(
    "✅ Continuation (vous avez sauvegardé la seed phrase, n'est-ce pas?)\n",
  );

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
  console.log(
    "   - Backup multiple recommandé (2-3 copies en lieux différents)",
  );
  console.log("");
  console.log("3. SÉPARATION DEV/PRODUCTION:");
  console.log("   - Générer des wallets DIFFÉRENTS pour dev et prod");
  console.log("   - Ne JAMAIS réutiliser les mêmes XPUB");
  console.log("   - En dev: utiliser testnet (Base Sepolia, Tron Nile)");
  console.log("");

  // =============================================================================
  // 4. CONFIGURATION VERCEL DASHBOARD (PRODUCTION)
  // =============================================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📝 CONFIGURATION VERCEL DASHBOARD - PRODUCTION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log(
    "⚠️  ATTENTION: Ces XPUBs doivent être configurés dans VERCEL, pas .env.local!",
  );
  console.log("");
  console.log("📋 ÉTAPES À SUIVRE:");
  console.log("");
  console.log("1️⃣  Aller sur Vercel Dashboard:");
  console.log("   → https://vercel.com/dashboard");
  console.log("   → Sélectionner le projet 'mycryptopilot'");
  console.log("   → Settings → Environment Variables");
  console.log("");
  console.log("2️⃣  Ajouter ces 2 variables (Production scope uniquement):");
  console.log("");
  console.log(`   Variable: CRYPTO_XPUB_BASE`);
  console.log(`   Value:    ${baseXpub}`);
  console.log(`   Scope:    Production`);
  console.log("");
  console.log(`   Variable: CRYPTO_XPUB_TRON`);
  console.log(`   Value:    ${tronXpub}`);
  console.log(`   Scope:    Production`);
  console.log("");
  console.log("3️⃣  Redéployer l'application:");
  console.log(
    "   → Vercel va automatiquement redéployer avec les nouvelles variables",
  );
  console.log("   → OU forcer un redeploy: Deployments → ... → Redeploy");
  console.log("");

  // =============================================================================
  // 5. VÉRIFICATION & TESTING PRODUCTION
  // =============================================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ VÉRIFICATION & TESTING");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("🧪 TESTER EN PRODUCTION (recommandé avec un petit montant!):");
  console.log("");
  console.log("1️⃣  Aller sur votre site de production:");
  console.log("   → https://mycryptopilot.com/orgs/[slug]/checkout/pro");
  console.log("");
  console.log("2️⃣  Vérifier la génération des adresses:");
  console.log("   → Base address (0x...) doit s'afficher ✅");
  console.log("   → Tron address (T...) doit s'afficher ✅");
  console.log("   → Le QR code doit être visible");
  console.log("");
  console.log("3️⃣  Tester avec un paiement réel de $1:");
  console.log("   → Utiliser le plan 'Test Payment' (optionnel)");
  console.log("   → Envoyer 1 USDC (Base) ou 1 USDT (Tron)");
  console.log("   → Coût estimé: ~$1.10 (incluant les frais réseau)");
  console.log("   → Vérifier que le paiement est détecté (5-30 secondes)");
  console.log("");
  console.log("4️⃣  Checklist de sécurité finale:");
  console.log(
    "   ✅ Les 2 seed phrases sont sauvegardées dans un vault sécurisé",
  );
  console.log("   ✅ Les seed phrases ne sont PAS dans Git (.gitignore)");
  console.log("   ✅ Les XPUBs sont dans Vercel (Production scope uniquement)");
  console.log("   ✅ Un paiement test a réussi");
  console.log("   ✅ Les fonds reçus sont accessibles via les seed phrases");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✨ Wallets PRODUCTION générés avec succès!");
  console.log(
    "🚀 Votre système de paiement crypto est prêt à recevoir de l'argent réel!\n",
  );
  console.log("⚠️  RAPPEL: Gardez les seed phrases en SÉCURITÉ ABSOLUE!\n");
}

// Exécuter le script
main().catch(console.error);
