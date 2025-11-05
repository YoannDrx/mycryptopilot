/**
 * Tests for Feature Flags (Issue #77)
 *
 * Tests unitaires pour les feature flags de migration Organizations → User
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Feature Flags", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules pour forcer le rechargement des feature flags
    vi.resetModules();
  });

  afterEach(() => {
    // Restaurer env
    process.env = originalEnv;
  });

  describe("USER_ACCOUNT_MODE", () => {
    it("should be false by default (legacy mode)", async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = undefined;
      const { FEATURES } = await import("@/lib/feature-flags");

      expect(FEATURES.USER_ACCOUNT_MODE).toBe(false);
    });

    it('should be false when explicitly set to "false"', async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "false";
      const { FEATURES } = await import("@/lib/feature-flags");

      expect(FEATURES.USER_ACCOUNT_MODE).toBe(false);
    });

    it('should be true when explicitly set to "true"', async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "true";
      const { FEATURES } = await import("@/lib/feature-flags");

      expect(FEATURES.USER_ACCOUNT_MODE).toBe(true);
    });
  });

  describe("LEGACY_ORG_REDIRECTS", () => {
    it("should be true by default", async () => {
      process.env.NEXT_PUBLIC_LEGACY_REDIRECTS = undefined;
      const { FEATURES } = await import("@/lib/feature-flags");

      expect(FEATURES.LEGACY_ORG_REDIRECTS).toBe(true);
    });

    it('should be false when explicitly set to "false"', async () => {
      process.env.NEXT_PUBLIC_LEGACY_REDIRECTS = "false";
      const { FEATURES } = await import("@/lib/feature-flags");

      expect(FEATURES.LEGACY_ORG_REDIRECTS).toBe(false);
    });

    it("should be true for any other value", async () => {
      process.env.NEXT_PUBLIC_LEGACY_REDIRECTS = "true";
      const { FEATURES } = await import("@/lib/feature-flags");

      expect(FEATURES.LEGACY_ORG_REDIRECTS).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    it("isLegacyMode() should return true when USER_ACCOUNT_MODE is false", async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "false";
      const { isLegacyMode } = await import("@/lib/feature-flags");

      expect(isLegacyMode()).toBe(true);
    });

    it("isLegacyMode() should return false when USER_ACCOUNT_MODE is true", async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "true";
      const { isLegacyMode } = await import("@/lib/feature-flags");

      expect(isLegacyMode()).toBe(false);
    });

    it("isUserAccountMode() should return false when USER_ACCOUNT_MODE is false", async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "false";
      const { isUserAccountMode } = await import("@/lib/feature-flags");

      expect(isUserAccountMode()).toBe(false);
    });

    it("isUserAccountMode() should return true when USER_ACCOUNT_MODE is true", async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "true";
      const { isUserAccountMode } = await import("@/lib/feature-flags");

      expect(isUserAccountMode()).toBe(true);
    });

    it('getArchitectureMode() should return "legacy" when USER_ACCOUNT_MODE is false', async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "false";
      const { getArchitectureMode } = await import("@/lib/feature-flags");

      expect(getArchitectureMode()).toBe("legacy");
    });

    it('getArchitectureMode() should return "user-centric" when USER_ACCOUNT_MODE is true', async () => {
      process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE = "true";
      const { getArchitectureMode } = await import("@/lib/feature-flags");

      expect(getArchitectureMode()).toBe("user-centric");
    });
  });
});
