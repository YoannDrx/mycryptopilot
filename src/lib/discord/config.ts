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

  /**
   * IDs des channels Discord fixes (Phase 0.2)
   * Get IDs: Right-click channel → Copy ID (Developer Mode required)
   */
  channels: {
    FREE_SIGNALS: process.env.DISCORD_FREE_SIGNALS_CHANNEL_ID ?? "",
    LOGS: process.env.DISCORD_LOG_CHANNEL_ID ?? "",
  } as const,

  /**
   * ID du rôle Admin (Phase 0.2)
   * Get ID: Right-click role → Copy ID (Developer Mode required)
   */
  adminRoleId: process.env.DISCORD_ROLE_ADMIN_ID ?? "",
} as const;

export type DiscordRoleName = keyof typeof DISCORD_CONFIG.roles;
