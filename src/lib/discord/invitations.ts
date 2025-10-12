import { discordBot } from "./bot-client";
import { logger } from "../logger";
import { Resend } from "resend";
import { env } from "../env";
import DiscordInviteEmail from "@email/discord-invite";

const resend = new Resend(env.RESEND_API_KEY);

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
  try {
    // Générer invite link
    const inviteUrl = await generatePermanentInvite();

    if (!inviteUrl) {
      logger.error("Failed to generate invite URL");
      return false;
    }

    // Envoyer email
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: userEmail,
      subject: "🎉 Rejoins notre communauté Discord - MyCryptoPilot",
      react: DiscordInviteEmail({ userName, inviteUrl }),
    });

    if (error) {
      logger.error("Error sending Discord invite email:", error);
      return false;
    }

    logger.info(`✅ Discord invite email sent to ${userEmail}`);
    return true;
  } catch (error) {
    logger.error("Error in sendDiscordInviteEmail:", error);
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
