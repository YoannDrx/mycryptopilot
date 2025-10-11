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
import { ethers } from "ethers";
import TronWeb from "tronweb";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import type { CryptoNetwork } from "@/generated/prisma";

// ====================================
// Configuration
// ====================================

const MINIMUM_SWEEP_THRESHOLD_USDC = "10"; // Minimum 10 USDC to sweep (avoid gas waste)
const MINIMUM_SWEEP_THRESHOLD_USDT = "10"; // Minimum 10 USDT to sweep

// Base USDC contract address (mainnet)
const BASE_USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Tron USDT contract address (mainnet TRC-20)
const TRON_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// ERC-20 ABI (only balanceOf and transfer functions)
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

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

export async function sweepAllAddresses(): Promise<SweepResult[]> {
  console.log("🧹 Starting sweep of all crypto addresses to Binance...\n");

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

  // Sweep Base (USDC) addresses
  if (baseAddresses.length > 0) {
    console.log(`🟦 Checking ${baseAddresses.length} Base addresses...\n`);
    for (const addr of baseAddresses) {
      const result = await sweepBaseAddress(addr.address, addr.userId);
      results.push(result);
    }
  }

  // Sweep Tron (USDT) addresses
  if (tronAddresses.length > 0) {
    console.log(`🟣 Checking ${tronAddresses.length} Tron addresses...\n`);
    for (const addr of tronAddresses) {
      const result = await sweepTronAddress(addr.address, addr.userId);
      results.push(result);
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

  return results;
}

// ====================================
// Base (USDC) Sweep
// ====================================

async function sweepBaseAddress(
  address: string,
  userId: string,
): Promise<SweepResult> {
  try {
    // TODO: Get Binance master wallet address from env
    const binanceMasterWallet = env.BINANCE_MASTER_WALLET_BASE;
    if (!binanceMasterWallet) {
      throw new Error("BINANCE_MASTER_WALLET_BASE not configured");
    }

    // Connect to Base RPC
    const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);

    // Get USDC contract
    const usdcContract = new ethers.Contract(
      BASE_USDC_CONTRACT,
      ERC20_ABI,
      provider,
    );

    // Check USDC balance
    const balance = await usdcContract.balanceOf(address);
    const decimals = await usdcContract.decimals();
    const balanceFormatted = ethers.formatUnits(balance, decimals);

    console.log(`  ${address}: ${balanceFormatted} USDC`);

    // Skip if balance below threshold
    if (parseFloat(balanceFormatted) < parseFloat(MINIMUM_SWEEP_THRESHOLD_USDC)) {
      return {
        address,
        network: "BASE",
        balance: balanceFormatted,
        swept: false,
      };
    }

    // TODO: Implement actual transfer
    // This requires access to the private key derived from mnemonic
    // For now, we return a placeholder
    console.log(`    ⚠️  Would sweep ${balanceFormatted} USDC to ${binanceMasterWallet}`);
    console.log(`    ⚠️  Transfer not implemented yet (requires private key access)`);

    return {
      address,
      network: "BASE",
      balance: balanceFormatted,
      swept: false,
      error: "Transfer not implemented (private key required)",
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
  userId: string,
): Promise<SweepResult> {
  try {
    // TODO: Get Binance master wallet address from env
    const binanceMasterWallet = env.BINANCE_MASTER_WALLET_TRON;
    if (!binanceMasterWallet) {
      throw new Error("BINANCE_MASTER_WALLET_TRON not configured");
    }

    // Connect to Tron RPC
    const tronWeb = new TronWeb({
      fullHost: env.TRON_RPC_URL,
    });

    // Get USDT TRC-20 balance
    const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT);
    const balance = await contract.balanceOf(address).call();
    const decimals = await contract.decimals().call();
    const balanceFormatted = (Number(balance) / 10 ** Number(decimals)).toFixed(2);

    console.log(`  ${address}: ${balanceFormatted} USDT`);

    // Skip if balance below threshold
    if (parseFloat(balanceFormatted) < parseFloat(MINIMUM_SWEEP_THRESHOLD_USDT)) {
      return {
        address,
        network: "TRON",
        balance: balanceFormatted,
        swept: false,
      };
    }

    // TODO: Implement actual transfer
    // This requires access to the private key derived from mnemonic
    console.log(`    ⚠️  Would sweep ${balanceFormatted} USDT to ${binanceMasterWallet}`);
    console.log(`    ⚠️  Transfer not implemented yet (requires private key access)`);

    return {
      address,
      network: "TRON",
      balance: balanceFormatted,
      swept: false,
      error: "Transfer not implemented (private key required)",
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
