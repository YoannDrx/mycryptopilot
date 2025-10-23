import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  verifyEncryptionSetup,
} from "@/lib/crypto/encryption-service";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("EncryptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("encryptApiKey", () => {
    it("should encrypt a plaintext API key", () => {
      const plaintext = "my-secret-api-key-12345";

      const encrypted = encryptApiKey(plaintext);

      expect(encrypted).toHaveProperty("encrypted");
      expect(encrypted).toHaveProperty("iv");
      expect(encrypted).toHaveProperty("tag");
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.tag).toBeTruthy();
      expect(typeof encrypted.encrypted).toBe("string");
      expect(typeof encrypted.iv).toBe("string");
      expect(typeof encrypted.tag).toBe("string");
    });

    it("should produce different encrypted values for same plaintext (different IVs)", () => {
      const plaintext = "my-secret-api-key";

      const encrypted1 = encryptApiKey(plaintext);
      const encrypted2 = encryptApiKey(plaintext);

      // Different IVs mean different encrypted values
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.tag).not.toBe(encrypted2.tag);
    });

    it("should encrypt empty string", () => {
      const plaintext = "";

      const encrypted = encryptApiKey(plaintext);

      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.tag).toBeTruthy();
    });

    it("should encrypt long strings", () => {
      const plaintext = "a".repeat(1000);

      const encrypted = encryptApiKey(plaintext);

      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.encrypted.length).toBeGreaterThan(0);
    });

    it("should encrypt special characters", () => {
      const plaintext = "!@#$%^&*()_+-={}[]|:;<>?,./~`";

      const encrypted = encryptApiKey(plaintext);

      expect(encrypted.encrypted).toBeTruthy();
    });
  });

  describe("decryptApiKey", () => {
    it("should decrypt an encrypted API key back to plaintext", () => {
      const plaintext = "my-secret-api-key-12345";

      const encrypted = encryptApiKey(plaintext);
      const decrypted = decryptApiKey(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag,
      );

      expect(decrypted).toBe(plaintext);
    });

    it("should handle empty string encryption/decryption", () => {
      const plaintext = "";

      const encrypted = encryptApiKey(plaintext);
      const decrypted = decryptApiKey(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag,
      );

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings encryption/decryption", () => {
      const plaintext = "a".repeat(1000);

      const encrypted = encryptApiKey(plaintext);
      const decrypted = decryptApiKey(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag,
      );

      expect(decrypted).toBe(plaintext);
    });

    it("should handle special characters encryption/decryption", () => {
      const plaintext = "!@#$%^&*()_+-={}[]|:;<>?,./~`";

      const encrypted = encryptApiKey(plaintext);
      const decrypted = decryptApiKey(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag,
      );

      expect(decrypted).toBe(plaintext);
    });

    it("should throw error when decrypting with wrong IV", () => {
      const plaintext = "my-secret-api-key";

      const encrypted = encryptApiKey(plaintext);
      const wrongIv = "0".repeat(32); // Wrong IV

      expect(() => {
        decryptApiKey(encrypted.encrypted, wrongIv, encrypted.tag);
      }).toThrow();
    });

    it("should throw error when decrypting with wrong tag (data tampering)", () => {
      const plaintext = "my-secret-api-key";

      const encrypted = encryptApiKey(plaintext);
      const wrongTag = "0".repeat(32); // Wrong tag

      expect(() => {
        decryptApiKey(encrypted.encrypted, encrypted.iv, wrongTag);
      }).toThrow(/integrity check failed|tampering/i);
    });

    it("should throw error when decrypting with wrong encrypted data", () => {
      const plaintext = "my-secret-api-key";

      const encrypted = encryptApiKey(plaintext);
      const wrongEncrypted = "0".repeat(encrypted.encrypted.length);

      expect(() => {
        decryptApiKey(wrongEncrypted, encrypted.iv, encrypted.tag);
      }).toThrow();
    });
  });

  describe("verifyEncryptionSetup", () => {
    it("should return true when encryption/decryption cycle works", () => {
      const isValid = verifyEncryptionSetup();

      expect(isValid).toBe(true);
    });

    it("should verify encryption integrity", () => {
      // Run verification multiple times to ensure consistency
      const results = Array.from({ length: 10 }, () => verifyEncryptionSetup());

      expect(results.every((result) => result === true)).toBe(true);
    });
  });

  describe("Security properties", () => {
    it("should use unique IV for each encryption", () => {
      const plaintext = "same-plaintext";

      const encrypted1 = encryptApiKey(plaintext);
      const encrypted2 = encryptApiKey(plaintext);
      const encrypted3 = encryptApiKey(plaintext);

      // All IVs should be unique
      const ivs = [encrypted1.iv, encrypted2.iv, encrypted3.iv];
      const uniqueIvs = new Set(ivs);

      expect(uniqueIvs.size).toBe(3);
    });

    it("should produce different ciphertext for same plaintext (due to unique IVs)", () => {
      const plaintext = "same-plaintext";

      const encrypted1 = encryptApiKey(plaintext);
      const encrypted2 = encryptApiKey(plaintext);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);

      // But both should decrypt to same plaintext
      const decrypted1 = decryptApiKey(
        encrypted1.encrypted,
        encrypted1.iv,
        encrypted1.tag,
      );
      const decrypted2 = decryptApiKey(
        encrypted2.encrypted,
        encrypted2.iv,
        encrypted2.tag,
      );

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it("should detect data tampering via auth tag", () => {
      const plaintext = "sensitive-data";

      const encrypted = encryptApiKey(plaintext);

      // Tamper with encrypted data (flip one bit)
      const tamperedEncrypted = `a${encrypted.encrypted.slice(1)}`;

      // Decryption should fail due to auth tag mismatch
      expect(() => {
        decryptApiKey(tamperedEncrypted, encrypted.iv, encrypted.tag);
      }).toThrow();
    });

    it("should ensure IV is 16 bytes (32 hex chars)", () => {
      const plaintext = "test";

      const encrypted = encryptApiKey(plaintext);

      expect(encrypted.iv.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("should ensure auth tag is 16 bytes (32 hex chars)", () => {
      const plaintext = "test";

      const encrypted = encryptApiKey(plaintext);

      expect(encrypted.tag.length).toBe(32); // 16 bytes = 32 hex chars
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle Binance API key encryption/decryption", () => {
      const binanceApiKey =
        "nKdNVSLZnKdNVSLZnKdNVSLZnKdNVSLZnKdNVSLZnKdNVSLZnKdNVSLZ";
      const binanceSecretKey =
        "9Y8XJHGFDS9Y8XJHGFDS9Y8XJHGFDS9Y8XJHGFDS9Y8XJHGFDS9Y8XJHGFDS";

      const encryptedApiKey = encryptApiKey(binanceApiKey);
      const encryptedSecretKey = encryptApiKey(binanceSecretKey);

      const decryptedApiKey = decryptApiKey(
        encryptedApiKey.encrypted,
        encryptedApiKey.iv,
        encryptedApiKey.tag,
      );
      const decryptedSecretKey = decryptApiKey(
        encryptedSecretKey.encrypted,
        encryptedSecretKey.iv,
        encryptedSecretKey.tag,
      );

      expect(decryptedApiKey).toBe(binanceApiKey);
      expect(decryptedSecretKey).toBe(binanceSecretKey);
    });

    it("should handle multiple sequential encryptions without interference", () => {
      const keys = [
        "api-key-1",
        "api-key-2",
        "api-key-3",
        "api-key-4",
        "api-key-5",
      ];

      const encryptedKeys = keys.map((key) => ({
        original: key,
        encrypted: encryptApiKey(key),
      }));

      encryptedKeys.forEach(({ original, encrypted }) => {
        const decrypted = decryptApiKey(
          encrypted.encrypted,
          encrypted.iv,
          encrypted.tag,
        );
        expect(decrypted).toBe(original);
      });
    });

    it("should handle concurrent encryptions", async () => {
      const keys = Array.from({ length: 100 }, (_, i) => `api-key-${i}`);

      const encryptedKeys = await Promise.all(
        keys.map(async (key) => ({
          original: key,
          encrypted: encryptApiKey(key),
        })),
      );

      const decryptionResults = await Promise.all(
        encryptedKeys.map(async ({ original, encrypted }) => {
          const decrypted = decryptApiKey(
            encrypted.encrypted,
            encrypted.iv,
            encrypted.tag,
          );
          return { original, decrypted };
        }),
      );

      decryptionResults.forEach(({ original, decrypted }) => {
        expect(decrypted).toBe(original);
      });
    });
  });
});
