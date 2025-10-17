import { discordBot } from "./bot-client";
import { logger } from "../logger";
import { env } from "../env";
import { sendEmail } from "../mail/send-email";
import DiscordInviteEmail from "@email/discord-invite";

/**
 * Générer un lien d'invitation permanent pour le serveur Discord
 *
 * @returns Invite URL ou null si erreur
 */
export async function generatePermanentInvite(): Promise<string | null> {
  const client = discordBot.getClient();

  if (!client) {
    logger.error("Discord bot not initialized");
    return null;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return null;
    }

    // Trouver channel #welcome (ou premier channel disponible)
    const welcomeChannel =
      guild.channels.cache.find(
        (ch) => ch.name === "welcome" && ch.isTextBased(),
      ) ?? guild.channels.cache.find((ch) => ch.isTextBased());

    if (!welcomeChannel) {
      logger.error("No text channel found to create invite");
      return null;
    }

    // Créer invite permanent (ne expire jamais, usage illimité)
    const invite = await guild.invites.create(welcomeChannel.id, {
      maxAge: 0, // Ne expire jamais
      maxUses: 0, // Usage illimité
      unique: false, // Réutiliser invite existant si possible
      reason: "MyCryptoPilot - Automated user onboarding",
    });

    logger.info(`✅ Generated permanent invite: ${invite.url}`);

    return invite.url;
  } catch (error) {
    logger.error("Error generating Discord invite:", error);
    return null;
  }
}

/**
 * Envoyer email avec lien d'invitation Discord
 *
 * @param userEmail - Email du user
 * @param userName - Nom du user
 * @returns true si email envoyé avec succès
 */
export async function sendDiscordInviteEmail(
  userEmail: string,
  userName: string,
): Promise<boolean> {
  // Skip email sending in test environment to avoid sending real emails
  if (env.NODE_ENV === "test") {
    logger.info(
      `[TEST MODE] Skipping Discord invite email to ${userEmail} (would send in production)`,
    );
    return true;
  }

  try {
    // Utiliser le lien statique d'abord (DISCORD_INVITE_URL dans .env)
    let inviteUrl: string | null | undefined = env.DISCORD_INVITE_URL;

    // Si pas de lien statique, générer dynamiquement via le bot
    if (!inviteUrl) {
      logger.info(
        "No static DISCORD_INVITE_URL found, generating via Discord bot...",
      );
      inviteUrl = await generatePermanentInvite();
    }

    if (!inviteUrl) {
      logger.error(
        "Failed to get Discord invite URL (neither static nor dynamic)",
      );
      logger.error(
        "💡 Set DISCORD_INVITE_URL in .env for development, or ensure Discord bot is running",
      );
      return false;
    }

    logger.info(`Sending Discord invite email with URL: ${inviteUrl}`);

    // Envoyer email via sendEmail() helper (centralise protections et config)
    const result = await sendEmail({
      to: userEmail,
      subject: "🎉 Rejoins notre communauté Discord - MyCryptoPilot",
      html: DiscordInviteEmail({ userName, inviteUrl }),
    });

    if (result.error) {
      logger.error("Error sending Discord invite email:", result.error);
      return false;
    }

    logger.info(`✅ Discord invite email sent successfully to ${userEmail}`);
    return true;
  } catch (error) {
    logger.error("Exception in sendDiscordInviteEmail:", error);
    return false;
  }
}

/**
 * Vérifier si un user a rejoint le Discord (via discordId)
 *
 * @param discordId - Discord ID du user (nullable)
 * @returns true si user a rejoint Discord
 */
export async function hasUserJoinedDiscord(
  discordId: string | null,
): Promise<boolean> {
  if (!discordId) return false;

  const client = discordBot.getClient();

  if (!client) {
    logger.warn("Discord bot not initialized");
    return false;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return false;
    }

    const member = await guild.members.fetch(discordId).catch(() => null);

    return !!member;
  } catch (error) {
    logger.error("Error checking if user joined Discord:", error);
    return false;
  }
}
