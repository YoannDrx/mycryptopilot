import { discordBot } from "./bot-client";
import { logger } from "../logger";
import { env } from "../env";

/**
 * Retirer un user du Discord complètement
 * - Retirer tous les rôles (user reste dans le serveur mais sans accès)
 * - Utilisé quand un user supprime son compte
 *
 * @param discordId - Discord ID du user
 * @returns true si succès, false si erreur
 */
export async function removeUserFromDiscord(
  discordId: string,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client || !env.DISCORD_GUILD_ID) {
    logger.warn(
      "Discord bot not configured, skipping user removal from Discord",
    );
    return false;
  }

  try {
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(discordId).catch(() => null);

    if (!member) {
      logger.info(
        `Discord user ${discordId} not found in guild, already removed or never joined`,
      );
      return true; // Consider this success - user already not in server
    }

    // Remove all roles (user stays in server but loses all access)
    logger.info(`Removing all roles from Discord user ${discordId}...`);
    await member.roles.set([], "User account deleted from MyCryptoPilot");

    logger.info(`✅ Discord access revoked for user ${discordId}`);
    return true;
  } catch (error) {
    logger.error("Error removing user from Discord:", error);
    return false;
  }
}

/**
 * Révoquer l'accès aux channels privés d'un trader
 * Utilisé quand un user unfollow un trader
 *
 * @param discordId - Discord ID du user
 * @param traderId - ID du trader
 * @returns true si succès, false si erreur
 */
export async function revokePrivateChannelAccess(
  discordId: string,
  traderId: string,
): Promise<boolean> {
  // TODO: Implémenter quand les channels privés par trader seront créés
  // Pour l'instant, les channels sont publics (FREE/PRO/ULTRA)
  logger.info(
    `Private channel access would be revoked for ${discordId} from trader ${traderId} (not implemented yet)`,
  );
  return true;
}
