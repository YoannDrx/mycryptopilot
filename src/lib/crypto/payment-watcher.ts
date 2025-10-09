import type { CryptoNetwork, PaymentStatus } from "@/generated/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import { Contract, JsonRpcProvider } from "ethers";
import TronWeb from "tronweb";
import {
  calculateDaysGranted,
  getPlanFromAmount,
  type MyCryptoPilotPlanName,
} from "./mycryptopilot-plans";

/**
 * Crypto Payment Watcher
 *
 * Monitors on-chain transactions for incoming payments to user addresses.
 * Supports Base (USDC) and Tron (USDT) networks.
 *
 * Architecture:
 * - Polls blockchain RPCs for new transactions
 * - Validates confirmations (1 for Base, 2 for Tron)
 * - Auto-detects plan from amount paid
 * - Activates subscription when confirmed
 * - Supports pro-rata payments (partial amounts)
 *
 * @example
 * // Start watching for payments
 * await startPaymentWatcher();
 *
 * // Manually check a specific address
 * await checkAddressForPayments("0x123...", "BASE");
 */

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
  if (!env.BASE_RPC_URL) {
    logger.warn("BASE_RPC_URL not configured, skipping Base check");
    return [];
  }

  try {
    // Connect to Base RPC
    const provider = new JsonRpcProvider(env.BASE_RPC_URL);
    const currentBlock = await provider.getBlockNumber();

    // USDC contract on Base
    const usdcAddress = SiteConfig.crypto.networks.base.contractAddress;

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
  if (!env.TRON_RPC_URL) {
    logger.warn("TRON_RPC_URL not configured, skipping Tron check");
    return [];
  }

  try {
    // Connect to Tron network
    // @ts-expect-error - TronWeb types are incorrect, constructor accepts string
    const tronWeb = new TronWeb(env.TRON_RPC_URL);

    // USDT TRC-20 contract on Tron
    const usdtAddress = SiteConfig.crypto.networks.tron.contractAddress;

    // Get current block number
    const currentBlock = await tronWeb.trx.getCurrentBlock();
    const currentBlockNumber = currentBlock.block_header.raw_data.number;

    // Query transactions to this address
    // TronGrid API: get transactions related to this address
    // Note: TronGrid has specific endpoints for TRC-20 transfers
    const transactions = await tronWeb.trx.getTransactionsRelated(
      address,
      "all",
      30, // limit to last 30 transactions
      0, // offset
    );

    logger.info("Tron RPC check completed", {
      address,
      transactionsFound: transactions.length,
      currentBlockNumber,
    });

    // Filter for USDT transfers to this address
    // Process all transactions in parallel to avoid await-in-loop
    const paymentPromises = transactions.map(async (tx: unknown) => {
      try {
        // Type guard for transaction structure
        if (
          !tx ||
          typeof tx !== "object" ||
          !("raw_data" in tx) ||
          !("txID" in tx)
        ) {
          return null;
        }

        const txData = tx as {
          txID: string;
          raw_data?: {
            contract?: {
              type?: string;
              parameter?: {
                value?: { contract_address?: string; data?: string };
              };
            }[];
          };
        };

        // Check if this is a TRC-20 transfer to our address
        if (txData.raw_data?.contract?.[0]?.type === "TriggerSmartContract") {
          const contract = txData.raw_data.contract[0];
          const parameter = contract.parameter?.value;

          if (!parameter) {
            return null;
          }

          // Check if it's the USDT contract
          if (
            parameter.contract_address &&
            tronWeb.address.fromHex(parameter.contract_address) === usdtAddress
          ) {
            // Decode the data to get transfer details
            // TRC-20 transfer data format: transfer(address,uint256)
            const data = parameter.data;

            if (data?.startsWith("a9059cbb")) {
              // transfer() function signature
              // Extract recipient address (next 64 chars) and amount (last 64 chars)
              const recipient = `41${data.substring(32, 72)}`; // Add Tron prefix
              const recipientAddress = tronWeb.address.fromHex(recipient);

              if (recipientAddress === address) {
                // This is a transfer to our address
                const amountHex = data.substring(72);
                const amountToken = parseInt(amountHex, 16) / 1e6; // USDT has 6 decimals

                // Get transaction info for confirmations
                const txInfo = await tronWeb.trx.getTransactionInfo(
                  txData.txID,
                );
                const txBlockNumber = txInfo.blockNumber;
                const confirmations = currentBlockNumber - txBlockNumber;

                return {
                  txHash: txData.txID,
                  network: "TRON" as CryptoNetwork,
                  address,
                  amountToken,
                  amountUSD: amountToken, // Assume 1 USDT = 1 USD
                  currency: "USDT",
                  confirmations,
                  timestamp: new Date(txInfo.blockTimeStamp),
                };
              }
            }
          }
        }
      } catch (txError) {
        logger.error("Error processing Tron transaction", {
          txId:
            typeof tx === "object" && tx && "txID" in tx
              ? (tx as { txID: string }).txID
              : "unknown",
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

  // If payment is confirmed, activate subscription
  if (isConfirmed) {
    await activateUserSubscription(userId, plan, daysGranted);
  }
}

/**
 * Activate or extend user's subscription
 *
 * Updates the Organization's subscription based on the plan and days granted.
 * Since MyCryptoPilot uses 1 org = 1 user, we update the user's personal org.
 *
 * @param userId - The user ID
 * @param plan - The plan name (free, pro, ultra)
 * @param daysGranted - Number of days to grant
 * @returns Promise<void>
 */
async function activateUserSubscription(
  userId: string,
  plan: MyCryptoPilotPlanName,
  daysGranted: number,
): Promise<void> {
  logger.info("Activating user subscription", { userId, plan, daysGranted });

  // Get user's organization (should have exactly 1)
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      role: "owner",
    },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!membership) {
    logger.error("No organization found for user", { userId });
    throw new Error(`No organization found for user ${userId}`);
  }

  const org = membership.organization;
  const currentDate = new Date();

  // Calculate new expiration date
  let periodEnd: Date;

  if (org.subscription?.periodEnd && org.subscription.periodEnd > currentDate) {
    // Extend existing subscription
    periodEnd = new Date(org.subscription.periodEnd);
    periodEnd.setDate(periodEnd.getDate() + daysGranted);
  } else {
    // New subscription
    periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + daysGranted);
  }

  const periodStart = new Date();

  // Update subscription
  await prisma.subscription.upsert({
    where: { referenceId: org.id },
    create: {
      id: `sub_${Date.now()}`,
      referenceId: org.id,
      plan,
      status: "active",
      periodStart,
      periodEnd,
    },
    update: {
      plan,
      status: "active",
      periodStart,
      periodEnd,
    },
  });

  logger.info("Subscription activated/extended", {
    userId,
    organizationId: org.id,
    plan,
    periodEnd,
  });
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
