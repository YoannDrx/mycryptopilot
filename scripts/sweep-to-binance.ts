/**
 * Script to sweep crypto funds from user payment addresses to Binance master wallet
 *
 * IMPORTANT: This script transfers funds from payment addresses to your Binance wallet
 * for centralized custody and easy EUR conversion/withdrawal.
 *
 * Usage:
 *   npx tsx scripts/sweep-to-binance.ts
 *
 * Configuration:
 *   Set BINANCE_MASTER_WALLET_BASE and BINANCE_MASTER_WALLET_TRON in .env.local
 *
 * Flow:
 *   1. Query all CryptoAddress entries in database
 *   2. Check balance of each address (Base USDC + Tron USDT)
 *   3. If balance > minimum threshold, sweep to Binance master wallet
 *   4. Update database with sweep transaction
 */

/* eslint-disable no-console */
import { ethers, HDNodeWallet, formatUnits } from "ethers";
import { config } from "dotenv";
import { resolve } from "path";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import type { CryptoNetwork } from "@/generated/prisma";
import { rejectFinancialExecution } from "@/config/product-features";

// Load sweep configuration from .env.sweep
config({ path: resolve(process.cwd(), ".env.sweep") });

// ====================================
// Configuration
// ====================================

// Load from .env.sweep (optional, defaults used if not set)
const DRY_RUN = process.env.DRY_RUN !== "false"; // Default: true (safe mode)
const MINIMUM_SWEEP_THRESHOLD_USD = parseFloat(
  process.env.SWEEP_MIN_THRESHOLD_USD ?? "10",
);

const MINIMUM_SWEEP_THRESHOLD_USDC = MINIMUM_SWEEP_THRESHOLD_USD.toString();
const MINIMUM_SWEEP_THRESHOLD_USDT = MINIMUM_SWEEP_THRESHOLD_USD.toString();

// Seed phrases (from .env.sweep)
const SWEEP_MNEMONIC_BASE = process.env.SWEEP_MNEMONIC_BASE;
const SWEEP_MNEMONIC_TRON = process.env.SWEEP_MNEMONIC_TRON;

// Network configuration
const IS_TESTNET = env.CRYPTO_NETWORK === "testnet";

// Base USDC contract address
const BASE_USDC_CONTRACT = IS_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // Base Sepolia testnet
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet

// Tron USDT contract address (TRC-20)
const TRON_USDT_CONTRACT = IS_TESTNET
  ? "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs" // Tron Shasta testnet
  : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Tron mainnet

// ERC-20 ABI (only balanceOf and transfer functions)
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// Constants for token decimals (USDC = 6, USDT = 6)
const USDC_DECIMALS = 6;
const USDT_DECIMALS = 6;

// Helper function to add delay between requests (rate limiting)
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to retry RPC calls with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("rate limit") ||
          error.message.includes("429") ||
          error.message.includes("-32016"));

      if (!isRateLimit || attempt === maxRetries - 1) {
        // If not rate limit or last attempt, throw immediately
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * 2 ** attempt;
      console.log(
        `    ⏳ Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`,
      );
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Max retries exceeded");
}

// ====================================
// Types
// ====================================

type SweepResult = {
  address: string;
  network: CryptoNetwork;
  balance: string;
  swept: boolean;
  txHash?: string;
  error?: string;
};

// ====================================
// Main Sweep Logic
// ====================================

/**
 * Display configuration and ask for user confirmation
 */
async function confirmSweep(): Promise<boolean> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚙️  SWEEP CONFIGURATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `Mode:               ${DRY_RUN ? "🔍 DRY RUN (preview only)" : "⚡ REAL SWEEP"}`,
  );
  console.log(
    `Network:            ${IS_TESTNET ? "🧪 Testnet" : "🚀 Mainnet"}`,
  );
  console.log(`Min threshold:      $${MINIMUM_SWEEP_THRESHOLD_USD} USD`);
  console.log(
    `Base wallet:        ${env.BINANCE_MASTER_WALLET_BASE ? "✅ Configured" : "❌ Missing"}`,
  );
  console.log(
    `Tron wallet:        ${env.BINANCE_MASTER_WALLET_TRON ? "✅ Configured" : "❌ Missing"}`,
  );
  console.log(
    `Base mnemonic:      ${SWEEP_MNEMONIC_BASE ? "✅ Configured" : "❌ Missing"}`,
  );
  console.log(
    `Tron mnemonic:      ${SWEEP_MNEMONIC_TRON ? "✅ Configured" : "❌ Missing"}`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (DRY_RUN) {
    console.log(
      "ℹ️  Dry-run mode enabled: No real transactions will be sent.\n",
    );
    console.log(
      "   To execute real sweep: DRY_RUN=false npx tsx scripts/sweep-to-binance.ts\n",
    );
    return true;
  }

  // Real sweep - ask for confirmation
  console.log("⚠️  WARNING: You are about to execute REAL sweep transactions!");
  console.log(
    "⚠️  Funds will be transferred to your Binance wallets immediately.\n",
  );

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '🔐 Type "CONFIRM" to proceed with sweep (or anything else to cancel): ',
      (answer: string) => {
        rl.close();
        console.log("");

        if (answer.trim().toUpperCase() === "CONFIRM") {
          console.log("✅ Confirmation received. Starting sweep...\n");
          resolve(true);
        } else {
          console.log("❌ Sweep cancelled by user.\n");
          resolve(false);
        }
      },
    );
  });
}

export async function sweepAllAddresses(): Promise<SweepResult[]> {
  rejectFinancialExecution("Crypto custody sweep");

  console.log("🧹 Starting sweep of all crypto addresses to Binance...\n");

  // Show configuration and ask for confirmation
  const confirmed = await confirmSweep();
  if (!confirmed) {
    console.log("🛑 Sweep aborted.\n");
    return [];
  }

  const results: SweepResult[] = [];

  // Fetch all active crypto addresses from database
  const addresses = await prisma.cryptoAddress.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log(`📊 Found ${addresses.length} active addresses to check\n`);

  // Group by network
  const baseAddresses = addresses.filter((a) => a.network === "BASE");
  const tronAddresses = addresses.filter((a) => a.network === "TRON");

  // Sweep Base (USDC) addresses sequentially to avoid rate limiting
  if (baseAddresses.length > 0) {
    console.log(`🟦 Checking ${baseAddresses.length} Base addresses...\n`);
    for (const addr of baseAddresses) {
      // eslint-disable-next-line no-await-in-loop
      const result = await sweepBaseAddress(addr.address, addr.userId);
      results.push(result);
      // Add small delay between addresses to avoid rate limiting
      if (baseAddresses.indexOf(addr) < baseAddresses.length - 1) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(500); // 500ms delay between addresses
      }
    }
  }

  // Sweep Tron (USDT) addresses sequentially to avoid rate limiting
  if (tronAddresses.length > 0) {
    console.log(`🟣 Checking ${tronAddresses.length} Tron addresses...\n`);
    for (const addr of tronAddresses) {
      // eslint-disable-next-line no-await-in-loop
      const result = await sweepTronAddress(addr.address, addr.userId);
      results.push(result);
      // Add small delay between addresses
      if (tronAddresses.indexOf(addr) < tronAddresses.length - 1) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(500); // 500ms delay between addresses
      }
    }
  }

  // Summary
  const sweptCount = results.filter((r) => r.swept).length;
  const totalSwept = results
    .filter((r) => r.swept)
    .reduce((sum, r) => sum + parseFloat(r.balance), 0);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅ Sweep completed!");
  console.log(`📦 Addresses checked: ${addresses.length}`);
  console.log(`💰 Funds swept: ${sweptCount} addresses`);
  console.log(`💵 Total amount: ~${totalSwept.toFixed(2)} USD`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Display sweep details
  if (sweptCount > 0) {
    console.log("📋 Sweep Details:");
    results
      .filter((r) => r.swept && r.txHash)
      .forEach((r) => {
        const explorerUrl =
          r.network === "BASE"
            ? IS_TESTNET
              ? `https://sepolia.basescan.org/tx/${r.txHash}`
              : `https://basescan.org/tx/${r.txHash}`
            : IS_TESTNET
              ? `https://shasta.tronscan.org/#/transaction/${r.txHash}`
              : `https://tronscan.org/#/transaction/${r.txHash}`;

        console.log(`  • ${r.network}: ${r.balance} swept`);
        console.log(`    TX: ${r.txHash}`);
        console.log(`    Explorer: ${explorerUrl}\n`);
      });
  }

  return results;
}

// ====================================
// Base (USDC) Sweep
// ====================================

async function sweepBaseAddress(
  address: string,
  _userId: string,
): Promise<SweepResult> {
  try {
    // Validate configuration
    const binanceMasterWallet = env.BINANCE_MASTER_WALLET_BASE;
    if (!binanceMasterWallet) {
      throw new Error("BINANCE_MASTER_WALLET_BASE not configured");
    }

    if (!SWEEP_MNEMONIC_BASE) {
      throw new Error(
        "SWEEP_MNEMONIC_BASE not configured in .env.sweep (required for sweep)",
      );
    }

    // Connect to Base RPC
    const rpcUrl = IS_TESTNET ? env.BASE_RPC_URL_TESTNET : env.BASE_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get USDC contract
    const usdcContract = new ethers.Contract(
      BASE_USDC_CONTRACT,
      ERC20_ABI,
      provider,
    );

    // Check USDC balance (with retry for rate limiting)
    const balance = await retryWithBackoff(async () =>
      usdcContract.balanceOf(address),
    );
    const balanceFormatted = formatUnits(balance, USDC_DECIMALS);

    console.log(`  ${address}: ${balanceFormatted} USDC`);

    // Skip if balance below threshold
    if (
      parseFloat(balanceFormatted) < parseFloat(MINIMUM_SWEEP_THRESHOLD_USDC)
    ) {
      return {
        address,
        network: "BASE",
        balance: balanceFormatted,
        swept: false,
      };
    }

    // Check if already swept
    const dbAddress = await prisma.cryptoAddress.findUnique({
      where: { address },
    });

    if (dbAddress?.sweptAt) {
      console.log(
        `    ⏭️  Already swept on ${dbAddress.sweptAt.toISOString()} (tx: ${dbAddress.sweptTxHash})`,
      );
      return {
        address,
        network: "BASE",
        balance: balanceFormatted,
        swept: false,
        error: "Already swept",
      };
    }

    if (!dbAddress?.derivationPath) {
      throw new Error(
        "Address not found in database or missing derivation path",
      );
    }

    // DRY RUN MODE: Preview only
    if (DRY_RUN) {
      console.log(
        `    🔍 [DRY RUN] Would sweep ${balanceFormatted} USDC to ${binanceMasterWallet}`,
      );
      return {
        address,
        network: "BASE",
        balance: balanceFormatted,
        swept: false,
        error: "Dry-run mode (no real transfer)",
      };
    }

    // REAL SWEEP: Derive private key from mnemonic
    console.log(`    🔑 Deriving private key from mnemonic...`);

    // Parse derivation path (format: "m/44'/60'/0'/0/123")
    // We need to extract the account index from the end
    const pathParts = dbAddress.derivationPath.split("/");
    const accountIndex = pathParts[pathParts.length - 1];

    // Derive wallet from mnemonic
    const hdWallet = HDNodeWallet.fromPhrase(SWEEP_MNEMONIC_BASE);
    const derivedWallet = hdWallet.derivePath(`m/44'/60'/0'/0/${accountIndex}`);

    // Verify derived address matches
    if (derivedWallet.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error(
        `Derived address mismatch! Expected ${address}, got ${derivedWallet.address}. Check mnemonic.`,
      );
    }

    console.log(`    ✅ Private key derived successfully`);

    // Connect wallet to provider
    const wallet = derivedWallet.connect(provider);

    // Check ETH balance for gas fees
    const ethBalance = await provider.getBalance(address);
    const ethBalanceFormatted = formatUnits(ethBalance, 18);

    console.log(`    ⛽ ETH balance: ${ethBalanceFormatted} ETH`);

    if (ethBalance === BigInt(0)) {
      throw new Error(
        "Insufficient ETH for gas fees. Send ~0.001 ETH to this address first.",
      );
    }

    // Estimate gas for transfer
    const usdcWithSigner = usdcContract.connect(wallet);
    const transferAmount = balance; // Transfer entire balance

    console.log(`    📊 Estimating gas...`);

    // Prepare transaction data for gas estimation
    const txData = usdcWithSigner.interface.encodeFunctionData("transfer", [
      binanceMasterWallet,
      transferAmount,
    ]);

    const gasEstimate = await provider.estimateGas({
      from: address,
      to: BASE_USDC_CONTRACT,
      data: txData,
    });

    const gasPrice = (await provider.getFeeData()).gasPrice ?? BigInt(0);
    const gasCostWei = gasEstimate * gasPrice;
    const gasCostEth = formatUnits(gasCostWei, 18);
    const gasCostUSD = parseFloat(gasCostEth) * 3000; // Rough ETH price estimate

    console.log(
      `    ⛽ Estimated gas: ${gasEstimate.toString()} units (~$${gasCostUSD.toFixed(2)})`,
    );

    if (ethBalance < gasCostWei) {
      throw new Error(
        `Insufficient ETH for gas. Need ${gasCostEth} ETH, have ${ethBalanceFormatted} ETH`,
      );
    }

    // Execute transfer
    console.log(
      `    💸 Sending ${balanceFormatted} USDC to ${binanceMasterWallet}...`,
    );

    const tx = await wallet.sendTransaction({
      to: BASE_USDC_CONTRACT,
      data: txData,
    });

    console.log(`    📤 Transaction sent: ${tx.hash}`);
    console.log(`    ⏳ Waiting for confirmation (1 block)...`);

    const receipt = await tx.wait(1);

    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed");
    }

    console.log(`    ✅ Transfer confirmed in block ${receipt.blockNumber}`);

    // Update database
    await prisma.cryptoAddress.update({
      where: { address },
      data: {
        sweptAt: new Date(),
        sweptTxHash: tx.hash,
      },
    });

    console.log(`    💾 Database updated`);

    return {
      address,
      network: "BASE",
      balance: balanceFormatted,
      swept: true,
      txHash: tx.hash,
    };
  } catch (error) {
    console.error(`    ❌ Error sweeping ${address}:`, error);
    return {
      address,
      network: "BASE",
      balance: "0",
      swept: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ====================================
// Tron (USDT) Sweep
// ====================================

async function sweepTronAddress(
  address: string,
  _userId: string,
): Promise<SweepResult> {
  try {
    // Validate configuration
    const binanceMasterWallet = env.BINANCE_MASTER_WALLET_TRON;
    if (!binanceMasterWallet) {
      throw new Error("BINANCE_MASTER_WALLET_TRON not configured");
    }

    if (!SWEEP_MNEMONIC_TRON) {
      throw new Error(
        "SWEEP_MNEMONIC_TRON not configured in .env.sweep (required for sweep)",
      );
    }

    // Connect to Tron RPC
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TronWebModule = require("tronweb");
    const TronWeb =
      TronWebModule.default?.TronWeb ??
      TronWebModule.TronWeb ??
      TronWebModule.default ??
      TronWebModule;

    const rpcUrl = IS_TESTNET ? env.TRON_RPC_URL_TESTNET : env.TRON_RPC_URL;
    const tronWeb = new TronWeb({ fullHost: rpcUrl });

    // Get USDT TRC-20 balance (with retry and from parameter)
    const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT);
    const balance = await retryWithBackoff(() =>
      contract.balanceOf(address).call({ from: address }),
    );
    const balanceFormatted = (Number(balance) / 10 ** USDT_DECIMALS).toFixed(2);

    console.log(`  ${address}: ${balanceFormatted} USDT`);

    // Skip if balance below threshold
    if (
      parseFloat(balanceFormatted) < parseFloat(MINIMUM_SWEEP_THRESHOLD_USDT)
    ) {
      return {
        address,
        network: "TRON",
        balance: balanceFormatted,
        swept: false,
      };
    }

    // Check if already swept
    const dbAddress = await prisma.cryptoAddress.findUnique({
      where: { address },
    });

    if (dbAddress?.sweptAt) {
      console.log(
        `    ⏭️  Already swept on ${dbAddress.sweptAt.toISOString()} (tx: ${dbAddress.sweptTxHash})`,
      );
      return {
        address,
        network: "TRON",
        balance: balanceFormatted,
        swept: false,
        error: "Already swept",
      };
    }

    if (!dbAddress?.derivationPath) {
      throw new Error(
        "Address not found in database or missing derivation path",
      );
    }

    // DRY RUN MODE: Preview only
    if (DRY_RUN) {
      console.log(
        `    🔍 [DRY RUN] Would sweep ${balanceFormatted} USDT to ${binanceMasterWallet}`,
      );
      return {
        address,
        network: "TRON",
        balance: balanceFormatted,
        swept: false,
        error: "Dry-run mode (no real transfer)",
      };
    }

    // REAL SWEEP: Derive private key from mnemonic
    console.log(`    🔑 Deriving private key from mnemonic...`);

    // Parse derivation path (format: "m/44'/195'/0'/0/123")
    const pathParts = dbAddress.derivationPath.split("/");
    const accountIndex = pathParts[pathParts.length - 1];

    // Derive private key using @scure/bip32 (same as address generation)
    const { HDKey } = await import("@scure/bip32");
    const { mnemonicToSeedSync } = await import("@scure/bip39");

    const seed = mnemonicToSeedSync(SWEEP_MNEMONIC_TRON);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive(`m/44'/195'/0'/0/${accountIndex}`);

    if (!derivedKey.privateKey) {
      throw new Error("Failed to derive private key from Tron mnemonic");
    }

    // Convert private key to hex string (TronWeb expects hex without 0x prefix)
    const privateKeyHex = Buffer.from(derivedKey.privateKey).toString("hex");

    // Create TronWeb instance with private key
    const tronWebWithKey = new TronWeb({
      fullHost: rpcUrl,
      privateKey: privateKeyHex,
    });

    // Verify derived address matches
    const derivedAddress = tronWebWithKey.address.fromPrivateKey(privateKeyHex);
    if (derivedAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error(
        `Derived address mismatch! Expected ${address}, got ${derivedAddress}. Check mnemonic.`,
      );
    }

    console.log(`    ✅ Private key derived successfully`);

    // Check TRX balance for fees
    const trxBalance = await tronWeb.trx.getBalance(address);
    const trxBalanceFormatted = (trxBalance / 1e6).toFixed(6);

    console.log(`    ⛽ TRX balance: ${trxBalanceFormatted} TRX`);

    if (trxBalance === 0) {
      throw new Error(
        "Insufficient TRX for fees. Send ~5 TRX to this address first.",
      );
    }

    // Get contract with private key for signing
    const contractWithKey = await tronWebWithKey
      .contract()
      .at(TRON_USDT_CONTRACT);

    // Execute transfer
    console.log(
      `    💸 Sending ${balanceFormatted} USDT to ${binanceMasterWallet}...`,
    );

    const transferResult = await contractWithKey
      .transfer(binanceMasterWallet, balance)
      .send({
        feeLimit: 100_000_000, // 100 TRX max fee
      });

    if (!transferResult) {
      throw new Error("Transfer failed - no transaction returned");
    }

    console.log(`    📤 Transaction sent: ${transferResult}`);
    console.log(`    ⏳ Waiting for confirmation (2 blocks)...`);

    // Wait for confirmation (poll transaction status)
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (!confirmed && attempts < maxAttempts) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      try {
        // eslint-disable-next-line no-await-in-loop
        const txInfo = await tronWeb.trx.getTransactionInfo(transferResult);
        if (txInfo?.blockNumber) {
          confirmed = true;
          console.log(
            `    ✅ Transfer confirmed in block ${txInfo.blockNumber}`,
          );
        }
      } catch {
        // Transaction not yet confirmed
      }
    }

    if (!confirmed) {
      throw new Error("Transaction confirmation timeout (30s)");
    }

    // Update database
    await prisma.cryptoAddress.update({
      where: { address },
      data: {
        sweptAt: new Date(),
        sweptTxHash: transferResult,
      },
    });

    console.log(`    💾 Database updated`);

    return {
      address,
      network: "TRON",
      balance: balanceFormatted,
      swept: true,
      txHash: transferResult,
    };
  } catch (error) {
    console.error(`    ❌ Error sweeping ${address}:`, error);
    return {
      address,
      network: "TRON",
      balance: "0",
      swept: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ====================================
// CLI Entry Point
// ====================================

if (require.main === module) {
  sweepAllAddresses()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Sweep failed:", error);
      process.exit(1);
    });
}
