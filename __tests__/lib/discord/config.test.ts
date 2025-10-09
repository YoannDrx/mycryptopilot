import { DISCORD_CONFIG } from "@/lib/discord/config";
import { describe, expect, it } from "vitest";

describe("Discord Config", () => {
  describe("roles", () => {
    it("should have all plan roles defined", () => {
      expect(DISCORD_CONFIG.roles.FREE).toBe("Free Member");
      expect(DISCORD_CONFIG.roles.PRO).toBe("Pro Trader");
      expect(DISCORD_CONFIG.roles.ULTRA).toBe("Ultra Trader");
    });

    it("should have 3 role mappings", () => {
      const roleKeys = Object.keys(DISCORD_CONFIG.roles);
      expect(roleKeys).toHaveLength(3);
    });
  });

  describe("roleColors", () => {
    it("should have all plan colors defined", () => {
      expect(DISCORD_CONFIG.roleColors.FREE).toBe(0x6b7280); // Gray
      expect(DISCORD_CONFIG.roleColors.PRO).toBe(0xf59e0b); // Amber
      expect(DISCORD_CONFIG.roleColors.ULTRA).toBe(0x8b5cf6); // Purple
    });

    it("should have valid hex colors", () => {
      const colors = Object.values(DISCORD_CONFIG.roleColors);

      for (const color of colors) {
        expect(color).toBeGreaterThanOrEqual(0x000000);
        expect(color).toBeLessThanOrEqual(0xffffff);
      }
    });

    it("should have 3 color mappings", () => {
      const colorKeys = Object.keys(DISCORD_CONFIG.roleColors);
      expect(colorKeys).toHaveLength(3);
    });
  });

  describe("isEnabled", () => {
    it("should return a boolean", () => {
      const result = DISCORD_CONFIG.isEnabled();
      expect(typeof result).toBe("boolean");
    });
  });
});
