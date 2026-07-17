/**
 * User Exchange Connection Service
 *
 * Manages exchange API connections for regular users (followers) who want
 * to use auto copy-trading functionality.
 *
 * Differences from ExchangeConnection (traders):
 * - Users connect to execute copied trades automatically
 * - No trade history sync (users don't publish trades)
 * - Simpler configuration (just API keys + mode)
 * - Used by copy-trading execution engine
 *
 * Security:
 * - API keys encrypted using AES-256-GCM
 * - Same encryption service as ExchangeConnection
 * - Keys stored securely with IV and auth tag
 *
 * @example
 * // User connects Binance for auto copy-trading
 * const connection = await createUserExchangeConnection({
 *   userId: "user-123",
 *   exchange: "BINANCE",
 *   apiKey: "xxx",
 *   apiSecret: "yyy",
 *   mode: "AUTO"
 * });
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  encryptApiKey,
  decryptApiKey,
  serializeEncryptedPayload,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import {
  createExchangeService,
  isPublicReadOnlyExchange,
} from "@/lib/exchange/exchange-service-factory";
import type {
  UserExchangeConnection,
  Exchange,
  CopyMode,
} from "@/generated/prisma";
import { isMyCryptoPilotFeatureActive } from "@/config/product-features";

export type CreateUserExchangeConnectionInput = {
  /** User ID */
  userId: string;

  /** Exchange to connect (BINANCE, BYBIT) */
  exchange: Exchange;

  /** API Key (plain text - will be encrypted) */
  apiKey: string;

  /** API Secret (plain text - will be encrypted) */
  apiSecret: string;

  /** Optional passphrase (required for Bitget) */
  passphrase?: string;

  /** Copy trading mode */
  mode: CopyMode;
};

export type UpdateUserExchangeConnectionInput = {
  /** Connection ID */
  connectionId: string;

  /** Update API credentials (optional) */
  apiKey?: string;
  apiSecret?: string;
  passphrase?: string | null;

  /** Update mode (optional) */
  mode?: CopyMode;

  /** Update active status (optional) */
  isActive?: boolean;
};

/**
 * Create User Exchange Connection
 *
 * Creates a new exchange API connection for a user to enable auto copy-trading.
 * API credentials are encrypted before storage.
 *
 * @param input - Connection parameters
 * @returns Created UserExchangeConnection
 *
 * @throws Error if userId invalid
 * @throws Error if user already has connection for this exchange
 * @throws Error if API key validation fails
 *
 * @example
 * const connection = await createUserExchangeConnection({
 *   userId: "user-123",
 *   exchange: "BINANCE",
 *   apiKey: "binance_api_key",
 *   apiSecret: "binance_secret",
 *   mode: "AUTO"
 * });
 */
export async function createUserExchangeConnection(
  input: CreateUserExchangeConnectionInput,
): Promise<UserExchangeConnection> {
  if (!isMyCryptoPilotFeatureActive("copyTrading")) {
    throw new Error(
      "User execution connections are disabled in the read-only demonstrator.",
    );
  }

  const { userId, exchange, apiKey, apiSecret, passphrase, mode } = input;

  // Validation
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!apiKey || !apiSecret) {
    throw new Error("API key and secret are required");
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Check if connection already exists for this exchange
  const existingConnection = await prisma.userExchangeConnection.findUnique({
    where: {
      userId_exchange: {
        userId,
        exchange,
      },
    },
  });

  if (existingConnection) {
    throw new Error(
      `User already has a ${exchange} connection. Use update instead.`,
    );
  }

  logger.info("Creating user exchange connection", {
    userId,
    userName: user.name,
    exchange,
    mode,
  });

  // Encrypt API credentials
  // Note: We encrypt both key and secret separately, but use the same IV/tag storage
  // This is secure because:
  // 1. Each encryption uses a unique IV (generated fresh each time)
  // 2. The auth tag provides integrity verification
  // 3. We're encrypting different plaintext with the same key+IV (acceptable for AES-GCM)
  const encryptedKey = encryptApiKey(apiKey);
  const encryptedSecret = encryptApiKey(apiSecret);
  const normalizedPassphrase = passphrase?.trim();
  const encryptedPassphrase = normalizedPassphrase
    ? serializeEncryptedPayload(encryptApiKey(normalizedPassphrase))
    : null;

  // Create connection
  let detectedBitgetMode: "UTA" | "CLASSIC" | null = null;
  if (exchange === "BITGET") {
    const service = createExchangeService(exchange, apiKey, apiSecret, {
      passphrase: normalizedPassphrase ?? null,
    });

    try {
      const status = await service.testConnection();
      detectedBitgetMode = status.bitgetAccountMode ?? "UTA";
    } catch (error) {
      logger.error("Failed to validate Bitget connection for user", {
        userId,
        error,
      });
      throw error;
    } finally {
      await service.close();
    }
  }

  const connection = await prisma.userExchangeConnection.create({
    data: {
      userId,
      exchange,
      mode,
      isActive: true,

      // Encrypted API key (with its own IV/tag)
      encryptedApiKey: encryptedKey.encrypted,
      keyIv: encryptedKey.iv,
      keyTag: encryptedKey.tag,

      // Encrypted API secret (with its own IV/tag stored in the same encrypted string)
      // We'll store it as: `${encrypted}:${iv}:${tag}` format
      encryptedSecretKey: serializeEncryptedPayload(encryptedSecret),
      encryptedPassphrase,
      bitgetAccountMode: detectedBitgetMode,
    },
  });

  logger.info("User exchange connection created successfully", {
    connectionId: connection.id,
    userId,
    exchange,
  });

  return connection;
}

/**
 * Get User Exchange Connection
 *
 * @param connectionId - Connection ID
 * @returns Connection or null if not found
 */
export async function getUserExchangeConnection(
  connectionId: string,
): Promise<UserExchangeConnection | null> {
  return prisma.userExchangeConnection.findUnique({
    where: { id: connectionId },
  });
}

/**
 * Get User Exchange Connections by User ID
 *
 * @param userId - User ID
 * @returns Array of connections
 */
export async function getUserExchangeConnections(
  userId: string,
): Promise<UserExchangeConnection[]> {
  return prisma.userExchangeConnection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get User Connection for Specific Exchange
 *
 * @param userId - User ID
 * @param exchange - Exchange name
 * @returns Connection or null if not found
 */
export async function getUserConnectionForExchange(
  userId: string,
  exchange: Exchange,
): Promise<UserExchangeConnection | null> {
  return prisma.userExchangeConnection.findUnique({
    where: {
      userId_exchange: {
        userId,
        exchange,
      },
    },
  });
}

/**
 * Update User Exchange Connection
 *
 * @param input - Update parameters
 * @returns Updated connection
 */
export async function updateUserExchangeConnection(
  input: UpdateUserExchangeConnectionInput,
): Promise<UserExchangeConnection> {
  const { connectionId, apiKey, apiSecret, passphrase, mode, isActive } = input;

  if (mode === "AUTO" && !isMyCryptoPilotFeatureActive("copyTrading")) {
    throw new Error(
      "Automatic exchange execution is disabled in the read-only demonstrator.",
    );
  }

  // Check if connection exists
  const existing = await prisma.userExchangeConnection.findUnique({
    where: { id: connectionId },
  });

  if (!existing) {
    throw new Error(`Connection not found: ${connectionId}`);
  }

  logger.info("Updating user exchange connection", {
    connectionId,
    hasNewApiKey: !!apiKey,
    hasNewApiSecret: !!apiSecret,
    mode,
    isActive,
  });

  // Prepare update data
  const updateData: {
    mode?: CopyMode;
    isActive?: boolean;
    encryptedApiKey?: string;
    keyIv?: string;
    keyTag?: string;
    encryptedSecretKey?: string;
    encryptedPassphrase?: string | null;
    bitgetAccountMode?: "UTA" | "CLASSIC" | null;
    lastError?: null;
  } = {};

  if (mode !== undefined) {
    updateData.mode = mode;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  // Update API key if provided
  if (apiKey) {
    const encrypted = encryptApiKey(apiKey);
    updateData.encryptedApiKey = encrypted.encrypted;
    updateData.keyIv = encrypted.iv;
    updateData.keyTag = encrypted.tag;
  }

  // Update API secret if provided
  if (apiSecret) {
    const encrypted = encryptApiKey(apiSecret);
    updateData.encryptedSecretKey = serializeEncryptedPayload(encrypted);
  }

  if (passphrase !== undefined) {
    const normalized = passphrase?.trim();
    updateData.encryptedPassphrase = normalized
      ? serializeEncryptedPayload(encryptApiKey(normalized))
      : null;
  }

  const credentialsChanged =
    apiKey !== undefined ||
    apiSecret !== undefined ||
    passphrase !== undefined;

  if (existing.exchange === "BITGET" && credentialsChanged) {
    const resolvedApiKey =
      apiKey ??
      decryptApiKey(existing.encryptedApiKey, existing.keyIv, existing.keyTag);
    const resolvedSecret =
      apiSecret ??
      decryptSerializedPayload(
        existing.encryptedSecretKey,
        existing.keyIv,
        existing.keyTag,
      );
    const resolvedPassphrase =
      passphrase !== undefined
        ? passphrase?.trim() ?? null
        : decryptOptionalSerializedPayload(
            existing.encryptedPassphrase,
            existing.keyIv,
            existing.keyTag,
          );

    const service = createExchangeService(
      existing.exchange,
      resolvedApiKey,
      resolvedSecret,
      { passphrase: resolvedPassphrase ?? null },
    );

    try {
      const status = await service.testConnection();
      updateData.bitgetAccountMode = status.bitgetAccountMode ?? "UTA";
    } finally {
      await service.close();
    }
  }

  // Clear error on update
  if (credentialsChanged) {
    updateData.lastError = null;
  }

  const updated = await prisma.userExchangeConnection.update({
    where: { id: connectionId },
    data: updateData,
  });

  logger.info("User exchange connection updated successfully", {
    connectionId,
  });

  return updated;
}

/**
 * Delete User Exchange Connection
 *
 * @param connectionId - Connection ID
 * @returns Deleted connection
 */
export async function deleteUserExchangeConnection(
  connectionId: string,
): Promise<UserExchangeConnection> {
  const connection = await prisma.userExchangeConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error(`Connection not found: ${connectionId}`);
  }

  logger.info("Deleting user exchange connection", {
    connectionId,
    userId: connection.userId,
    exchange: connection.exchange,
  });

  const deleted = await prisma.userExchangeConnection.delete({
    where: { id: connectionId },
  });

  logger.info("User exchange connection deleted successfully", {
    connectionId,
  });

  return deleted;
}

/**
 * Decrypt API Credentials
 *
 * Retrieves and decrypts API credentials for a user's exchange connection.
 * Used by copy-trading execution engine.
 *
 * @param connectionId - Connection ID
 * @returns Decrypted credentials
 *
 * @throws Error if connection not found
 * @throws Error if decryption fails
 */
export async function getDecryptedCredentials(connectionId: string): Promise<{
  apiKey: string;
  apiSecret: string;
  passphrase: string | null;
  exchange: Exchange;
  mode: CopyMode;
}> {
  const connection = await prisma.userExchangeConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error(`Connection not found: ${connectionId}`);
  }

  if (!connection.isActive) {
    throw new Error(`Connection is inactive: ${connectionId}`);
  }

  try {
    // Decrypt API key
    const apiKey = decryptApiKey(
      connection.encryptedApiKey,
      connection.keyIv,
      connection.keyTag,
    );

    const apiSecret = decryptSerializedPayload(
      connection.encryptedSecretKey,
      connection.keyIv,
      connection.keyTag,
    );
    const passphrase = decryptOptionalSerializedPayload(
      connection.encryptedPassphrase,
      connection.keyIv,
      connection.keyTag,
    );

    return {
      apiKey,
      apiSecret,
      passphrase,
      exchange: connection.exchange,
      mode: connection.mode,
    };
  } catch (error) {
    logger.error("Failed to decrypt user exchange credentials", {
      connectionId,
      error,
    });

    // Update connection with error
    await prisma.userExchangeConnection.update({
      where: { id: connectionId },
      data: {
        lastError: `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        isActive: false, // Disable connection if decryption fails
      },
    });

    throw new Error(
      `Failed to decrypt credentials for connection ${connectionId}`,
    );
  }
}

/**
 * Test User Exchange Connection
 *
 * Validates API credentials by attempting a simple API call to the exchange.
 * Does not sync or execute trades.
 *
 * @param connectionId - Connection ID
 * @returns Test result with success/error
 */
export async function testUserExchangeConnection(
  connectionId: string,
): Promise<{
  success: boolean;
  message: string;
  accountInfo?: {
    canTrade: boolean;
    permissions: string[];
  };
}> {
  let service: ReturnType<typeof createExchangeService> | null = null;

  try {
    const credentials = await getDecryptedCredentials(connectionId);

    logger.info("Testing user exchange connection", {
      connectionId,
      exchange: credentials.exchange,
    });

    if (!isPublicReadOnlyExchange(credentials.exchange)) {
      return {
        success: false,
        message:
          "This exchange is not available for new read-only connections.",
      };
    }

    service = createExchangeService(
      credentials.exchange,
      credentials.apiKey,
      credentials.apiSecret,
      { passphrase: credentials.passphrase },
    );
    const status = await service.testConnection();

    if (!status.isValid) {
      return {
        success: false,
        message: status.errorMessage ?? "Exchange rejected the credentials.",
      };
    }

    if (!status.isReadOnly || status.canTrade === true) {
      await prisma.userExchangeConnection.update({
        where: { id: connectionId },
        data: {
          isActive: false,
          lastError: "Trading permissions detected; connection disabled.",
        },
      });
      return {
        success: false,
        message:
          "Trading permissions were detected. Create a new read-only API key.",
        accountInfo: {
          canTrade: true,
          permissions: status.permissions ?? [],
        },
      };
    }

    // Update lastSyncedAt to indicate test was successful
    await prisma.userExchangeConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });

    return {
      success: true,
      message: "Connection test successful",
      accountInfo: {
        canTrade: false,
        permissions: status.permissions ?? ["READ_ONLY"],
      },
    };
  } catch (error) {
    logger.error("User exchange connection test failed", {
      connectionId,
      error,
    });

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Connection test failed",
    };
  } finally {
    await service?.close();
  }
}
