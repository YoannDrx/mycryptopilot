/**
 * Discord Bot Configuration
 *
 * Plans mapping to Discord role names
 */
export const DISCORD_CONFIG = {
  /**
   * Vérifier si le bot est activé
   */
  isEnabled: () => {
    // Read directly from process.env to get live values (important for standalone script)
    return (
      process.env.DISCORD_BOT_ENABLED === "true" &&
      !!process.env.DISCORD_BOT_TOKEN
    );
  },

  /**
   * Mapping des plans MyCryptoPilot vers les rôles Discord
   */
  roles: {
    FREE: "Free Member",
    PRO: "Pro Trader",
    ULTRA: "Ultra Trader",
  } as const,

  /**
   * Couleurs des rôles Discord (format hexadécimal)
   */
  roleColors: {
    FREE: 0x6b7280, // Gray
    PRO: 0xf59e0b, // Amber (brand color)
    ULTRA: 0x8b5cf6, // Purple
  } as const,
} as const;

export type DiscordRoleName = keyof typeof DISCORD_CONFIG.roles;
