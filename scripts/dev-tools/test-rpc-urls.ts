/**
 * Script: Test RPC URLs (Alchemy + TronGrid)
 *
 * Vérifie que les RPC URLs sont correctement configurées:
 * - Base Network (Alchemy): Connexion + Block Number
 * - Tron Network (TronGrid): Connexion + Block Number
 *
 * Usage:
 *   npx tsx scripts/test-rpc-urls.ts
 *
 * @see docs/RPC_SETUP_TUTORIAL.md
 */

/* eslint-disable no-console */

import { JsonRpcProvider } from "ethers";
import * as TronWebModule from "tronweb";
import "dotenv/config";

// Extract TronWeb constructor from module
const TronWeb = TronWebModule.TronWeb;

// Type for TronWeb instance (minimal interface for our usage)
type TronWebInstance = {
  trx: {
    getCurrentBlock: () => Promise<{
      block_header: {
        raw_data: {
          number: number;
        };
      };
    }>;
  };
};

const BASE_RPC_URL = process.env.BASE_RPC_URL;
const TRON_RPC_URL = process.env.TRON_RPC_URL;

console.log("🧪 Test des RPC URLs...\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// =============================================================================
// 1. TEST BASE NETWORK (Alchemy)
// =============================================================================
async function testBaseRPC() {
  console.log("📘 BASE NETWORK (Alchemy)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!BASE_RPC_URL) {
    console.error("❌ BASE_RPC_URL not configured in .env.local");
    console.log(
      '   Add: BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"',
    );
    return false;
  }

  console.log(`RPC URL: ${BASE_RPC_URL.substring(0, 50)}...`);

  try {
    // Connect to Base network
    const provider = new JsonRpcProvider(BASE_RPC_URL);

    // Get current block number
    const blockNumber = await provider.getBlockNumber();

    // Get network info
    const network = await provider.getNetwork();

    console.log("✅ Connexion réussie!");
    console.log(`Block actuel: ${blockNumber.toLocaleString()}`);
    console.log(`Network: Base Mainnet (chainId: ${network.chainId})`);
    console.log("");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion Base:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    console.log("");
    console.log("💡 Solutions:");
    console.log("   1. Vérifier que BASE_RPC_URL est correct dans .env.local");
    console.log(
      "   2. Vérifier ton API key Alchemy: https://dashboard.alchemy.com/",
    );
    console.log("   3. Tester manuellement:");
    console.log(
      `      curl "${BASE_RPC_URL}" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`,
    );
    console.log("");
    return false;
  }
}

// =============================================================================
// 2. TEST TRON NETWORK (TronGrid)
// =============================================================================
async function testTronRPC() {
  console.log("🔴 TRON NETWORK (TronGrid)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!TRON_RPC_URL) {
    console.error("❌ TRON_RPC_URL not configured in .env.local");
    console.log('   Add: TRON_RPC_URL="https://api.trongrid.io"');
    return false;
  }

  console.log(`RPC URL: ${TRON_RPC_URL}`);

  try {
    // Connect to Tron network
    const tronWeb = new (TronWeb as new (config: {
      fullHost: string;
    }) => TronWebInstance)({
      fullHost: TRON_RPC_URL,
    });

    // Get current block
    const currentBlock = await tronWeb.trx.getCurrentBlock();
    const blockNumber = currentBlock.block_header.raw_data.number;

    console.log("✅ Connexion réussie!");
    console.log(`Block actuel: ${blockNumber.toLocaleString()}`);
    console.log("Network: Tron Mainnet");
    console.log("");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion Tron:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    console.log("");
    console.log("💡 Solutions:");
    console.log("   1. Vérifier que TRON_RPC_URL est correct dans .env.local");
    console.log("   2. Utiliser l'URL publique: https://api.trongrid.io");
    console.log("   3. Tester manuellement:");
    console.log(`      curl "${TRON_RPC_URL}/wallet/getnowblock"`);
    console.log("");
    return false;
  }
}

// =============================================================================
// 3. RUN ALL TESTS
// =============================================================================
async function main() {
  const baseOk = await testBaseRPC();
  const tronOk = await testTronRPC();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (baseOk && tronOk) {
    console.log("✅ TOUS LES TESTS PASSENT! 🎉");
    console.log("");
    console.log("Tu es prêt à utiliser les paiements crypto!");
    console.log("");
    console.log("Prochaine étape:");
    console.log("  npx tsx scripts/generate-xpubs.ts");
    console.log("");
    process.exit(0);
  } else {
    console.log("❌ CERTAINS TESTS ONT ÉCHOUÉ");
    console.log("");
    console.log("Consulte le guide complet:");
    console.log("  docs/RPC_SETUP_TUTORIAL.md");
    console.log("");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erreur inattendue:", error);
  process.exit(1);
});
