import type { CryptoNetwork, PaymentStatus } from "@/generated/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import { Contract, JsonRpcProvider } from "ethers";
import { calculateDaysGranted, getPlanFromAmount } from "./mycryptopilot-plans";
import { activateSubscription } from "@/lib/subscription/subscription-manager";
import { isMyCryptoPilotFeatureActive } from "@/config/product-features";
import { sendEmail } from "@/lib/mail/send-email";
import { TestPaymentSuccessEmail } from "@email/test-payment-success";

/**
 * Crypto Payment Watcher
 *
 * Monitors on-chain transactions for incoming payments to user addresses.
 * Supports Base (USDC) and Tron (USDT) networks on both mainnet and testnet.
 *
 * Architecture:
 * - Polls blockchain RPCs for new transactions
 * - Validates confirmations (1 for Base, 2 for Tron)
 * - Auto-detects plan from amount paid
 * - Activates subscription when confirmed (except for 'test' plan)
 * - Supports pro-rata payments (partial amounts)
 *
 * Network Selection:
 * - Set CRYPTO_NETWORK=testnet in .env for Base Sepolia + Tron Shasta
 * - Defaults to mainnet in production
 *
 * @example
 * // Start watching for payments
 * await startPaymentWatcher();
 *
 * // Manually check a specific address
 * await checkAddressForPayments("0x123...", "BASE");
 */

/**
 * Get the appropriate RPC URL based on network and testnet mode
 */
function getRpcUrl(network: CryptoNetwork): string | undefined {
  const isTestnet = env.CRYPTO_NETWORK === "testnet";

  if (network === "BASE") {
    return isTestnet ? env.BASE_RPC_URL_TESTNET : env.BASE_RPC_URL;
  }

  if (network === "TRON") {
    return isTestnet ? env.TRON_RPC_URL_TESTNET : env.TRON_RPC_URL;
  }

  return undefined;
}

/**
 * Get network configuration (mainnet or testnet)
 */
function getNetworkConfig(network: CryptoNetwork) {
  const isTestnet = env.CRYPTO_NETWORK === "testnet";

  if (network === "BASE") {
    return isTestnet
      ? SiteConfig.crypto.testnet.base
      : SiteConfig.crypto.networks.base;
  }

  if (network === "TRON") {
    return isTestnet
      ? SiteConfig.crypto.testnet.tron
      : SiteConfig.crypto.networks.tron;
  }

  throw new Error(`Unknown network: ${network}`);
}

type PaymentDetection = {
  txHash: string;
  network: CryptoNetwork;
  address: string;
  amountToken: number;
  amountUSD: number;
  currency: string;
  confirmations: number;
  timestamp: Date;
};

/**
 * Check a specific crypto address for new payments
 *
 * @param address - The crypto address to check
 * @param network - The network (BASE or TRON)
 * @returns Promise<PaymentDetection[]> - Array of detected payments
 */
export async function checkAddressForPayments(
  address: string,
  network: CryptoNetwork,
): Promise<PaymentDetection[]> {
  logger.info("Checking address for payments", { address, network });

  switch (network) {
    case "BASE":
      return checkBaseAddress(address);
    case "TRON":
      return checkTronAddress(address);
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Check Base network address for USDC transfers
 *
 * Uses Base RPC to query transfer events for USDC token contract
 *
 * @param address - The Base address to check
 * @returns Promise<PaymentDetection[]>
 */
async function checkBaseAddress(address: string): Promise<PaymentDetection[]> {
  const rpcUrl = getRpcUrl("BASE");
  if (!rpcUrl) {
    const networkMode = env.CRYPTO_NETWORK ?? "mainnet";
    logger.warn(
      `BASE_RPC_URL${networkMode === "testnet" ? "_TESTNET" : ""} not configured, skipping Base check`,
    );
    return [];
  }

  try {
    // Connect to Base RPC (mainnet or testnet)
    const provider = new JsonRpcProvider(rpcUrl);
    const currentBlock = await provider.getBlockNumber();

    // USDC contract on Base (mainnet or testnet)
    const networkConfig = getNetworkConfig("BASE");
    const usdcAddress = networkConfig.contractAddress;

    // ERC-20 Transfer event ABI
    const usdcAbi = [
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ];

    const usdcContract = new Contract(usdcAddress, usdcAbi, provider);

    // Query Transfer events to this address
    // Look back 1000 blocks (approx 30 minutes on Base at 2s/block)
    const fromBlock = Math.max(0, currentBlock - 1000);
    const filter = usdcContract.filters.Transfer(null, address);
    const events = await usdcContract.queryFilter(filter, fromBlock, "latest");

    logger.info("Base RPC check completed", {
      address,
      eventsFound: events.length,
      fromBlock,
      currentBlock,
    });

    // Map events to PaymentDetection format
    const payments: PaymentDetection[] = await Promise.all(
      events.map(async (event) => {
        const tx = await event.getTransaction();
        const receipt = await event.getTransactionReceipt();

        // Extract value from event (handle both Log and EventLog types)
        const value =
          "args" in event && event.args[2] ? event.args[2] : BigInt(0);

        // USDC has 6 decimals
        const amountToken = Number(value) / 1e6;

        // For simplicity, assume 1 USDC = 1 USD (close enough for payment detection)
        const amountUSD = amountToken;

        const confirmations = currentBlock - receipt.blockNumber;

        return {
          txHash: tx.hash,
          network: "BASE" as CryptoNetwork,
          address,
          amountToken,
          amountUSD,
          currency: "USDC",
          confirmations,
          timestamp: new Date(),
        };
      }),
    );

    return payments;
  } catch (error) {
    logger.error("Error checking Base address", { address, error });
    return [];
  }
}

/**
 * Check Tron network address for USDT transfers
 *
 * Uses Tron RPC to query TRC-20 USDT transfers
 *
 * @param address - The Tron address to check
 * @returns Promise<PaymentDetection[]>
 */
async function checkTronAddress(address: string): Promise<PaymentDetection[]> {
  const rpcUrl = getRpcUrl("TRON");
  if (!rpcUrl) {
    const networkMode = env.CRYPTO_NETWORK ?? "mainnet";
    logger.warn(
      `TRON_RPC_URL${networkMode === "testnet" ? "_TESTNET" : ""} not configured, skipping Tron check`,
    );
    return [];
  }

  try {
    // Use require for TronWeb to avoid Turbopack ESM issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TronWebModule = require("tronweb");

    // Get the right constructor - Turbopack requires accessing default.TronWeb
    const TronWeb =
      TronWebModule.default?.TronWeb ??
      TronWebModule.TronWeb ??
      TronWebModule.default ??
      TronWebModule;

    // Connect to Tron network (mainnet or testnet)
    const tronWeb = new TronWeb({
      fullHost: rpcUrl,
    });

    // USDT TRC-20 contract on Tron (mainnet or testnet)
    const networkConfig = getNetworkConfig("TRON");
    const usdtAddress = networkConfig.contractAddress;

    // Get current block number
    const currentBlock = await tronWeb.trx.getCurrentBlock();
    const currentBlockNumber = currentBlock.block_header.raw_data.number;

    // Use TronGrid API directly for TRC-20 transfers (getTransactionsRelated is deprecated)
    const isTestnet = env.CRYPTO_NETWORK === "testnet";
    const tronGridUrl = isTestnet
      ? "https://api.shasta.trongrid.io"
      : "https://api.trongrid.io";

    const response = await fetch(
      `${tronGridUrl}/v1/accounts/${address}/transactions/trc20?limit=30`,
      {
        headers: {
          "TRON-PRO-API-KEY": env.TRON_API_KEY ?? "",
        },
      },
    );

    if (!response.ok) {
      logger.warn("TronGrid API request failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data = (await response.json()) as {
      data?: {
        transaction_id: string;
        token_info: { address: string; decimals: number };
        from: string;
        to: string;
        type: string;
        value: string;
        block_timestamp: number;
      }[];
    };

    const transactions = data.data ?? [];

    logger.info("Tron RPC check completed", {
      address,
      transactionsFound: transactions.length,
      currentBlockNumber,
    });

    // Filter for USDT transfers to this address
    // Process all transactions in parallel to avoid await-in-loop
    const paymentPromises = transactions.map(async (tx) => {
      try {
        // Check if this is a transfer TO our address (not FROM)
        if (tx.to.toLowerCase() !== address.toLowerCase()) {
          return null;
        }

        // Check if it's the USDT contract
        if (tx.token_info.address.toLowerCase() !== usdtAddress.toLowerCase()) {
          return null;
        }

        // Parse amount (value is in token's smallest unit)
        const decimals = tx.token_info.decimals;
        const amountToken = parseInt(tx.value, 10) / Math.pow(10, decimals);

        // Get transaction info for confirmations
        const txInfo = await tronWeb.trx.getTransactionInfo(tx.transaction_id);
        const txBlockNumber = txInfo.blockNumber;
        const confirmations = currentBlockNumber - txBlockNumber;

        return {
          txHash: tx.transaction_id,
          network: "TRON" as CryptoNetwork,
          address,
          amountToken,
          amountUSD: amountToken, // Assume 1 USDT = 1 USD
          currency: "USDT",
          confirmations,
          timestamp: new Date(txInfo.blockTimeStamp),
        };
      } catch (txError) {
        logger.error("Error processing Tron transaction", {
          txId: tx.transaction_id,
          error: txError,
        });
      }
      return null;
    });

    const allPayments = await Promise.all(paymentPromises);
    const payments = allPayments.filter(
      (p: PaymentDetection | null): p is PaymentDetection => p !== null,
    );

    return payments;
  } catch (error) {
    logger.error("Error checking Tron address", { address, error });
    return [];
  }
}

/**
 * Process a detected payment and update database
 *
 * Steps:
 * 1. Check if payment already exists in DB (avoid duplicates)
 * 2. Validate confirmation count meets network requirements
 * 3. Auto-detect plan from amount paid
 * 4. Create or update CryptoPayment record
 * 5. If confirmed, activate user's subscription
 *
 * @param payment - The detected payment
 * @param userId - The user ID this payment belongs to
 * @returns Promise<void>
 */
export async function processPayment(
  payment: PaymentDetection,
  userId: string,
): Promise<void> {
  logger.info("Processing payment", {
    txHash: payment.txHash,
    userId,
    amountUSD: payment.amountUSD,
  });

  // Check if payment already exists
  const existingPayment = await prisma.cryptoPayment.findUnique({
    where: { txHash: payment.txHash },
  });

  // Get network config
  const networkConfig =
    payment.network === "BASE"
      ? SiteConfig.crypto.networks.base
      : SiteConfig.crypto.networks.tron;

  const requiredConfirmations = networkConfig.confirmations;
  const isConfirmed = payment.confirmations >= requiredConfirmations;

  // Auto-detect plan from amount
  const plan = getPlanFromAmount(payment.amountUSD);
  const daysGranted = calculateDaysGranted(payment.amountUSD, plan);

  if (existingPayment) {
    // Update confirmations and status
    await prisma.cryptoPayment.update({
      where: { id: existingPayment.id },
      data: {
        confirmations: payment.confirmations,
        status: isConfirmed ? "CONFIRMED" : "PENDING",
        confirmedAt: isConfirmed ? new Date() : null,
      },
    });

    logger.info("Updated existing payment", {
      paymentId: existingPayment.id,
      confirmations: payment.confirmations,
      status: isConfirmed ? "CONFIRMED" : "PENDING",
    });
  } else {
    // Get the address ID
    const cryptoAddress = await prisma.cryptoAddress.findFirst({
      where: {
        address: payment.address,
        network: payment.network,
      },
    });

    // Create new payment record
    await prisma.cryptoPayment.create({
      data: {
        userId,
        addressId: cryptoAddress?.id,
        network: payment.network,
        txHash: payment.txHash,
        amountToken: payment.amountToken,
        amountUSD: payment.amountUSD,
        currency: payment.currency,
        confirmations: payment.confirmations,
        status: isConfirmed ? "CONFIRMED" : "PENDING",
        confirmedAt: isConfirmed ? new Date() : null,
        plan,
        daysGranted,
      },
    });

    logger.info("Created new payment record", {
      txHash: payment.txHash,
      plan,
      daysGranted,
      status: isConfirmed ? "CONFIRMED" : "PENDING",
    });
  }

  // If payment is confirmed, activate subscription (except for 'test' plan)
  if (isConfirmed && plan !== "test") {
    const result = await activateSubscription({ userId, plan, daysGranted });
    if (!result.success) {
      logger.error("Failed to activate subscription", {
        userId,
        plan,
        error: result.error,
      });
    }
  } else if (isConfirmed && plan === "test") {
    logger.info("Test payment confirmed, skipping subscription activation", {
      userId,
      txHash: payment.txHash,
    });

    // Send test payment success email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        const pricingUrl = `${SiteConfig.appUrl}/pricing`;

        await sendEmail({
          to: user.email,
          subject: `Test Payment Confirmed - ${SiteConfig.title}`,
          html: TestPaymentSuccessEmail({
            userName: user.name || "User",
            txHash: payment.txHash,
            network: payment.network as "BASE" | "TRON",
            amountUSD: payment.amountUSD,
            confirmedAt: new Date(),
            pricingUrl,
          }),
        });

        logger.info("Test payment success email sent", {
          userId,
          email: user.email,
          txHash: payment.txHash,
        });
      }
    } catch (emailError) {
      logger.error("Failed to send test payment success email", {
        userId,
        error: emailError,
      });
      // Don't throw - email failure shouldn't block payment processing
    }
  }
}

/**
 * Start the payment watcher service
 *
 * Polls all active crypto addresses for new payments at regular intervals.
 * Should be run as a background job (e.g., via cron or separate process).
 *
 * @param intervalMs - Polling interval in milliseconds (default: 60000 = 1 minute)
 * @returns Promise<void>
 */
export async function startPaymentWatcher(intervalMs = 60000): Promise<void> {
  if (!isMyCryptoPilotFeatureActive("publicPayments")) {
    logger.warn("Crypto payment watcher disabled by product feature manifest");
    return;
  }

  logger.info("Starting payment watcher", { intervalMs });

  const watchPayments = async (): Promise<void> => {
    try {
      // Get all active crypto addresses
      const addresses = await prisma.cryptoAddress.findMany({
        where: { isActive: true },
      });

      logger.info(`Checking ${addresses.length} addresses for payments`);

      // Check each address for new payments in parallel
      const allPayments = await Promise.all(
        addresses.map(async (addr) => {
          try {
            const payments = await checkAddressForPayments(
              addr.address,
              addr.network,
            );
            return payments.map((payment) => ({
              payment,
              userId: addr.userId,
            }));
          } catch (error) {
            logger.error("Error checking address", {
              address: addr.address,
              network: addr.network,
              error,
            });
            return [];
          }
        }),
      );

      // Flatten and process all detected payments
      const flatPayments = allPayments.flat();
      await Promise.all(
        flatPayments.map(async ({ payment, userId }) =>
          processPayment(payment, userId),
        ),
      );
    } catch (error) {
      logger.error("Error in payment watcher", { error });
    }
  };

  // Run initial check
  await watchPayments();

  // Schedule periodic checks
  setInterval(watchPayments, intervalMs);
}

/**
 * Manually retry processing a failed payment
 *
 * Useful for admin interface or debugging
 *
 * @param paymentId - The CryptoPayment ID to retry
 * @returns Promise<void>
 */
export async function retryPayment(paymentId: string): Promise<void> {
  const payment = await prisma.cryptoPayment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  logger.info("Retrying payment", { paymentId, txHash: payment.txHash });

  // Re-check confirmations on blockchain
  const payments = await checkAddressForPayments(
    payment.txHash, // Note: This is simplified, you'd need the address
    payment.network,
  );

  // Find the matching transaction
  const detectedPayment = payments.find((p) => p.txHash === payment.txHash);

  if (detectedPayment) {
    await processPayment(detectedPayment, payment.userId);
  } else {
    logger.warn("Payment not found on blockchain during retry", {
      paymentId,
      txHash: payment.txHash,
    });
  }
}

/**
 * Get payment status by transaction hash
 *
 * @param txHash - The transaction hash
 * @returns Promise<{ status: PaymentStatus, confirmations: number } | null>
 */
export async function getPaymentStatus(
  txHash: string,
): Promise<{ status: PaymentStatus; confirmations: number } | null> {
  const payment = await prisma.cryptoPayment.findUnique({
    where: { txHash },
    select: {
      status: true,
      confirmations: true,
    },
  });

  return payment;
}
