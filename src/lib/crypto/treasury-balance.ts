/**
 * Treasury Balance Service
 *
 * Récupère les balances crypto on-chain de toutes les adresses de paiement
 * pour afficher la trésorerie totale dans le dashboard admin.
 *
 * Architecture:
 * - Filtre les adresses non-swept (sweptAt: null)
 * - Récupération parallèle des balances (BASE + TRON)
 * - Utilise les mêmes RPCs que payment-watcher et sweep script
 * - Calcule également le montant swept historique
 *
 * @example
 * const treasury = await getTreasuryBalance();
 * console.log(`Total: $${treasury.totalUSD}`);
 */

import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// ====================================
// Configuration
// ====================================

const IS_TESTNET = env.CRYPTO_NETWORK === "testnet";

// Base USDC contract address
const BASE_USDC_CONTRACT = IS_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // Base Sepolia testnet
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet

// Tron USDT contract address (TRC-20)
const TRON_USDT_CONTRACT = IS_TESTNET
  ? "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs" // Tron Shasta testnet
  : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Tron mainnet

// ERC-20 ABI (only balanceOf)
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

// Token decimals (USDC = 6, USDT = 6)
const USDC_DECIMALS = 6;
const USDT_DECIMALS = 6;

// ====================================
// Types
// ====================================

export type TreasuryBalance = {
  base: {
    totalUSDC: number;
    addressCount: number;
  };
  tron: {
    totalUSDT: number;
    addressCount: number;
  };
  totalUSD: number;
  sweptAmount: number;
  lastUpdated: Date;
};

// ====================================
// Main Functions
// ====================================

/**
 * Récupère la balance totale de la trésorerie (on-chain + swept)
 *
 * Cette fonction:
 * 1. Récupère toutes les adresses actives NON swept de la DB
 * 2. Sépare les adresses BASE et TRON
 * 3. Récupère les balances on-chain en parallèle
 * 4. Calcule le montant swept historique depuis la DB
 * 5. Retourne les métriques complètes
 *
 * @returns Promise<TreasuryBalance>
 */
export async function getTreasuryBalance(): Promise<TreasuryBalance> {
  logger.info("Fetching treasury balance");

  // 1. Récupérer toutes adresses actives NON swept
  const addresses = await prisma.cryptoAddress.findMany({
    where: {
      isActive: true,
      sweptAt: null, // Seulement les non-swept
    },
    select: { address: true, network: true },
  });

  logger.info("Found active addresses to check", {
    totalAddresses: addresses.length,
  });

  // 2. Séparer BASE et TRON
  const baseAddresses = addresses.filter((a) => a.network === "BASE");
  const tronAddresses = addresses.filter((a) => a.network === "TRON");

  logger.info("Addresses by network", {
    baseCount: baseAddresses.length,
    tronCount: tronAddresses.length,
  });

  // 3. Récupérer balances BASE (parallèle)
  const baseBalances = await Promise.all(
    baseAddresses.map(async (addr) => getBaseBalance(addr.address)),
  );
  const totalBaseUSDC = baseBalances.reduce((sum, b) => sum + b, 0);

  // 4. Récupérer balances TRON (parallèle)
  const tronBalances = await Promise.all(
    tronAddresses.map(async (addr) => getTronBalance(addr.address)),
  );
  const totalTronUSDT = tronBalances.reduce((sum, b) => sum + b, 0);

  // 5. Récupérer montant swept historique
  const sweptAmount = await getSweptAmount();

  const result: TreasuryBalance = {
    base: {
      totalUSDC: totalBaseUSDC,
      addressCount: baseAddresses.length,
    },
    tron: {
      totalUSDT: totalTronUSDT,
      addressCount: tronAddresses.length,
    },
    totalUSD: totalBaseUSDC + totalTronUSDT, // 1:1 peg (USDC = USDT = 1 USD)
    sweptAmount,
    lastUpdated: new Date(),
  };

  logger.info("Treasury balance calculated", {
    totalUSD: result.totalUSD,
    sweptAmount: result.sweptAmount,
  });

  return result;
}

/**
 * Récupère le montant total déjà swept vers Binance
 *
 * Somme tous les paiements confirmés des adresses qui ont été swept.
 *
 * @returns Promise<number> - Total swept en USD
 */
export async function getSweptAmount(): Promise<number> {
  const sweptAddresses = await prisma.cryptoAddress.findMany({
    where: {
      isActive: true,
      sweptAt: { not: null }, // Seulement les swept
    },
    include: {
      payments: {
        where: {
          status: "CONFIRMED",
        },
        select: {
          amountUSD: true,
        },
      },
    },
  });

  const totalSwept = sweptAddresses.reduce((sum, addr) => {
    const addressTotal = addr.payments.reduce(
      (addrSum, payment) => addrSum + Number(payment.amountUSD),
      0,
    );
    return sum + addressTotal;
  }, 0);

  logger.info("Swept amount calculated", { totalSwept });

  return totalSwept;
}

// ====================================
// Helper Functions (Network Specific)
// ====================================

/**
 * Récupère la balance USDC d'une adresse BASE
 *
 * Utilise ethers.js + JsonRpcProvider + contract ERC-20.
 * Pattern identique à sweep-to-binance.ts ligne 338-341.
 *
 * @param address - L'adresse BASE (0x...)
 * @returns Promise<number> - Balance en USDC
 */
async function getBaseBalance(address: string): Promise<number> {
  try {
    // Connection RPC
    const rpcUrl = IS_TESTNET ? env.BASE_RPC_URL_TESTNET : env.BASE_RPC_URL;

    if (!rpcUrl) {
      logger.warn("BASE RPC URL not configured, returning 0 balance");
      return 0;
    }

    const provider = new JsonRpcProvider(rpcUrl);

    // Contract USDC ERC-20
    const usdcContract = new Contract(BASE_USDC_CONTRACT, ERC20_ABI, provider);

    // Récupération balance
    const balance = await usdcContract.balanceOf(address);
    const balanceFormatted = parseFloat(formatUnits(balance, USDC_DECIMALS));

    logger.debug("BASE balance fetched", { address, balanceFormatted });

    return balanceFormatted;
  } catch (error) {
    logger.error("Error fetching BASE balance", { address, error });
    return 0; // Retourner 0 en cas d'erreur pour ne pas bloquer tout le calcul
  }
}

/**
 * Récupère la balance USDT d'une adresse TRON
 *
 * Utilise TronWeb + contract TRC-20.
 * Pattern identique à sweep-to-binance.ts ligne 549-553.
 *
 * @param address - L'adresse TRON (T...)
 * @returns Promise<number> - Balance en USDT
 */
async function getTronBalance(address: string): Promise<number> {
  try {
    // Connection RPC
    const rpcUrl = IS_TESTNET ? env.TRON_RPC_URL_TESTNET : env.TRON_RPC_URL;

    if (!rpcUrl) {
      logger.warn("TRON RPC URL not configured, returning 0 balance");
      return 0;
    }

    // Import TronWeb (pattern du sweep script ligne 538-543)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TronWebModule = require("tronweb");
    const TronWeb =
      TronWebModule.default?.TronWeb ??
      TronWebModule.TronWeb ??
      TronWebModule.default ??
      TronWebModule;

    // Connection TronWeb
    const tronWeb = new TronWeb({ fullHost: rpcUrl });

    // Contract USDT TRC-20
    const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT);

    // Récupération balance (avec from parameter comme dans le script)
    const balance = await contract.balanceOf(address).call({ from: address });
    const balanceFormatted = Number(balance) / 10 ** USDT_DECIMALS;

    logger.debug("TRON balance fetched", { address, balanceFormatted });

    return balanceFormatted;
  } catch (error) {
    logger.error("Error fetching TRON balance", { address, error });
    return 0; // Retourner 0 en cas d'erreur pour ne pas bloquer tout le calcul
  }
}
