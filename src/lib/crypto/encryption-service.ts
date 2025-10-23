import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Encryption Service
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data (API keys).
 *
 * SECURITY:
 * - Algorithm: AES-256-GCM (industry standard, authenticated encryption)
 * - IV: Unique random bytes per encryption (16 bytes)
 * - Auth Tag: Ensures data integrity (16 bytes)
 * - Key: Derived from ENCRYPTION_SECRET env var (32 bytes min)
 *
 * @example
 * const encrypted = encryptApiKey("my-secret-api-key");
 * // Returns: { encrypted: "hex...", iv: "hex...", tag: "hex..." }
 *
 * const decrypted = decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.tag);
 * // Returns: "my-secret-api-key"
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

type EncryptedData = {
  encrypted: string; // Hex-encoded encrypted data
  iv: string; // Hex-encoded initialization vector
  tag: string; // Hex-encoded authentication tag
};

/**
 * Get encryption key from environment variable
 *
 * @returns Buffer - 32-byte encryption key
 * @throws Error if ENCRYPTION_SECRET is not configured or too short
 */
function getEncryptionKey(): Buffer {
  const secret = env.ENCRYPTION_SECRET;

  if (!secret) {
    const error = new Error(
      "ENCRYPTION_SECRET not configured in environment variables",
    );
    logger.error("Encryption key missing", { error: error.message });
    throw error;
  }

  if (secret.length < KEY_LENGTH) {
    const error = new Error(
      `ENCRYPTION_SECRET must be at least ${KEY_LENGTH} characters (got ${secret.length})`,
    );
    logger.error("Encryption key too short", {
      required: KEY_LENGTH,
      actual: secret.length,
    });
    throw error;
  }

  // Use first 32 bytes of secret as key
  return Buffer.from(secret.slice(0, KEY_LENGTH), "utf-8");
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param plaintext - The text to encrypt (e.g., API key)
 * @returns EncryptedData - Object containing encrypted data, IV, and auth tag
 * @throws Error if encryption fails
 */
export function encryptApiKey(plaintext: string): EncryptedData {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    const result: EncryptedData = {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };

    logger.info("API key encrypted successfully", {
      encryptedLength: encrypted.length,
    });

    return result;
  } catch (error) {
    logger.error("Failed to encrypt API key", { error });
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Decrypt encrypted data using AES-256-GCM
 *
 * @param encrypted - Hex-encoded encrypted data
 * @param iv - Hex-encoded initialization vector
 * @param tag - Hex-encoded authentication tag
 * @returns string - Decrypted plaintext
 * @throws Error if decryption fails or data is tampered
 */
export function decryptApiKey(
  encrypted: string,
  iv: string,
  tag: string,
): string {
  try {
    const key = getEncryptionKey();

    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    logger.info("API key decrypted successfully");

    return decrypted;
  } catch (error) {
    logger.error("Failed to decrypt API key", { error });

    // If auth tag verification fails, data was tampered
    if (error instanceof Error && error.message.includes("auth")) {
      throw new Error(
        "Decryption failed: Data integrity check failed (possible tampering)",
      );
    }

    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Verify that encryption/decryption cycle works correctly
 *
 * Used for testing and health checks
 *
 * @returns boolean - True if encryption/decryption works
 */
export function verifyEncryptionSetup(): boolean {
  try {
    const testData = "test-api-key-12345";
    const encrypted = encryptApiKey(testData);
    const decrypted = decryptApiKey(
      encrypted.encrypted,
      encrypted.iv,
      encrypted.tag,
    );

    const isValid = decrypted === testData;

    logger.info("Encryption setup verification", { isValid });

    return isValid;
  } catch (error) {
    logger.error("Encryption setup verification failed", { error });
    return false;
  }
}
