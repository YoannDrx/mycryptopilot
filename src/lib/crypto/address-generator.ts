import type { CryptoNetwork } from "@/generated/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { HDNodeWallet } from "ethers";
import { HDKey } from "@scure/bip32";
import { keccak_256 } from "@noble/hashes/sha3.js";
import bs58check from "bs58check";

/**
 * HD Wallet Address Generator
 *
 * Generates unique crypto addresses for users using HD wallet derivation (watch-only).
 * Supports Base (USDC) and Tron (USDT) networks.
 *
 * IMPORTANT: This service uses xpub (extended public keys) for address derivation.
 * Private keys are NEVER stored or accessible from this service.
 *
 * @example
 * const address = await generateCryptoAddress(user.id, "BASE");
 * // Returns: { address: "0x...", derivationPath: "m/44'/60'/0'/0/123", network: "BASE" }
 */

type CryptoAddressResult = {
  id: string;
  address: string;
  network: CryptoNetwork;
  derivationPath: string | null;
  userId: string;
};

/**
 * Generates a unique crypto address for a user on a specific network
 *
 * Algorithm:
 * 1. Check if user already has an active address for this network
 * 2. If exists, return existing address
 * 3. If not, derive a new address using HD wallet path
 * 4. Store in database and return
 *
 * @param userId - The user ID to generate address for
 * @param network - The crypto network (BASE or TRON)
 * @returns Promise<CryptoAddressResult> - The generated or existing address
 * @throws Error if xpub is not configured or derivation fails
 */
export async function generateCryptoAddress(
  userId: string,
  network: CryptoNetwork,
): Promise<CryptoAddressResult> {
  logger.info("Generating crypto address", { userId, network });

  // Check if user already has an active address for this network
  const existingAddress = await prisma.cryptoAddress.findFirst({
    where: {
      userId,
      network,
      isActive: true,
    },
  });

  if (existingAddress) {
    logger.info("Returning existing crypto address", {
      userId,
      network,
      address: existingAddress.address,
    });
    return existingAddress;
  }

  // Generate new address based on network
  let address: string;
  let derivationPath: string;

  switch (network) {
    case "BASE":
      if (!env.CRYPTO_XPUB_BASE) {
        throw new Error(
          "CRYPTO_XPUB_BASE is not configured. Cannot generate Base address.",
        );
      }
      ({ address, derivationPath } = await deriveBaseAddress(userId));
      break;

    case "TRON":
      if (!env.CRYPTO_XPUB_TRON) {
        throw new Error(
          "CRYPTO_XPUB_TRON is not configured. Cannot generate Tron address.",
        );
      }
      ({ address, derivationPath } = await deriveTronAddress(userId));
      break;

    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  // Store in database
  const cryptoAddress = await prisma.cryptoAddress.create({
    data: {
      userId,
      network,
      address,
      derivationPath,
      isActive: true,
    },
  });

  logger.info("Generated new crypto address", {
    userId,
    network,
    address: cryptoAddress.address,
    derivationPath,
  });

  return cryptoAddress;
}

/**
 * Derives a Base (Ethereum-compatible) address using HD wallet
 *
 * Derivation path: m/44'/60'/0'/0/{index}
 * - 44' = BIP44
 * - 60' = Ethereum coin type
 * - 0'/0 = Account 0, External chain
 * - {index} = Sequential user index
 *
 * @param userId - User ID to derive address for
 * @returns Promise<{ address: string, derivationPath: string }>
 */
async function deriveBaseAddress(
  userId: string,
): Promise<{ address: string; derivationPath: string }> {
  // Get next available index by counting existing Base addresses
  const count = await prisma.cryptoAddress.count({
    where: { network: "BASE" },
  });

  const index = count;
  const derivationPath = `m/44'/60'/0'/0/${index}`;

  // HD wallet derivation using ethers.js
  // 1. Parse the xpub (extended public key)
  // 2. Derive the child key at the given path (0/0/{index})
  // 3. Generate the Ethereum address from the derived public key
  try {
    const hdNode = HDNodeWallet.fromExtendedKey(env.CRYPTO_XPUB_BASE!);
    // Note: xpub already includes m/44'/60'/0' path, so we derive from there
    const wallet = hdNode.derivePath(`0/${index}`);
    const address = wallet.address;

    logger.info("Derived Base address from HD wallet", {
      derivationPath,
      index,
      address,
    });

    return { address, derivationPath };
  } catch (error) {
    logger.error("Failed to derive Base address from HD wallet", {
      error,
      derivationPath,
      index,
    });
    throw new Error(
      `Failed to derive Base address: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Derives a Tron address using HD wallet
 *
 * Derivation path: m/44'/195'/0'/0/{index}
 * - 44' = BIP44
 * - 195' = Tron coin type
 * - 0'/0 = Account 0, External chain
 * - {index} = Sequential user index
 *
 * @param userId - User ID to derive address for
 * @returns Promise<{ address: string, derivationPath: string }>
 */
async function deriveTronAddress(
  userId: string,
): Promise<{ address: string; derivationPath: string }> {
  // Get next available index by counting existing Tron addresses
  const count = await prisma.cryptoAddress.count({
    where: { network: "TRON" },
  });

  const index = count;
  const derivationPath = `m/44'/195'/0'/0/${index}`;

  // HD wallet derivation for Tron
  // 1. Parse the xpub using @scure/bip32
  // 2. Derive the child key at the given path (0/{index})
  // 3. Generate the Tron address (T...) from the derived public key
  try {
    const hdKey = HDKey.fromExtendedKey(env.CRYPTO_XPUB_TRON!);
    // Note: xpub already includes m/44'/195'/0' path, so we derive from there
    const child = hdKey.derive(`m/0/${index}`);

    if (!child.publicKey) {
      throw new Error("Failed to derive public key from Tron xpub");
    }

    // Convert public key to Tron address
    // 1. Hash public key (remove first byte 0x04 for uncompressed key)
    const pubKeyWithoutPrefix = child.publicKey.slice(1);
    const hash = keccak_256(pubKeyWithoutPrefix);

    // 2. Take last 20 bytes
    const addressBytes = hash.slice(-20);

    // 3. Add Tron mainnet prefix (0x41)
    const addressWithPrefix = new Uint8Array(21);
    addressWithPrefix[0] = 0x41;
    addressWithPrefix.set(addressBytes, 1);

    // 4. Encode in base58check
    const address = bs58check.encode(Buffer.from(addressWithPrefix));

    logger.info("Derived Tron address from HD wallet", {
      derivationPath,
      index,
      address,
    });

    return { address, derivationPath };
  } catch (error) {
    logger.error("Failed to derive Tron address from HD wallet", {
      error,
      derivationPath,
      index,
    });
    throw new Error(
      `Failed to derive Tron address: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get all active crypto addresses for a user
 *
 * @param userId - The user ID
 * @returns Promise<CryptoAddressResult[]> - Array of active addresses
 */
export async function getUserCryptoAddresses(
  userId: string,
): Promise<CryptoAddressResult[]> {
  return prisma.cryptoAddress.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Deactivate a crypto address (for security or if compromised)
 *
 * @param addressId - The crypto address ID to deactivate
 * @returns Promise<void>
 */
export async function deactivateCryptoAddress(
  addressId: string,
): Promise<void> {
  await prisma.cryptoAddress.update({
    where: { id: addressId },
    data: { isActive: false },
  });

  logger.info("Deactivated crypto address", { addressId });
}

/**
 * Get or create crypto addresses for a user on all supported networks
 * Useful when displaying payment options to user
 *
 * @param userId - The user ID
 * @returns Promise<CryptoAddressResult[]> - Array of addresses (one per network)
 */
export async function ensureUserCryptoAddresses(
  userId: string,
): Promise<CryptoAddressResult[]> {
  const networks: CryptoNetwork[] = ["BASE", "TRON"];

  const addressPromises = networks.map(async (network) => {
    try {
      return await generateCryptoAddress(userId, network);
    } catch (error) {
      logger.error(`Failed to generate ${network} address for user`, {
        userId,
        network,
        error,
      });
      return null;
    }
  });

  const results = await Promise.all(addressPromises);
  return results.filter(
    (address): address is CryptoAddressResult => address !== null,
  );
}
