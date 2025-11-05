import type { ChatInputCommandInteraction } from "discord.js";
import { logger } from "@/lib/logger";
import { SiteConfig } from "@/site-config";
import { handleHelpCommand } from "./help";
import { handleStatusCommand } from "./status";
import { handleUpgradeCommand } from "./upgrade";
import { handleSignalsCommand } from "./signals";
import { handleFollowCommand } from "./follow";
import {
  handleAdminSyncRoles,
  handleAdminStats,
  handleAdminCheckPermissions,
  handleAdminBotInfo,
  handleAdminAssignRole,
  handleAdminTestSignal,
  handleAdminTestWelcome,
  handleAdminEnsureTraderChannel,
  handleAdminNotify,
  handleAdminConfig,
} from "./admin-commands";
import { handleLinkCommand } from "./link";
import { handlePricingCommand } from "./pricing";
import { handleSupportCommand } from "./support";
import { handleRiskCommand } from "./risk";
import { handleUnfollowCommand } from "./unfollow";

/**
 * Gestionnaire principal des commandes Discord
 */
export async function handleCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const { commandName } = interaction;

  logger.info(
    `Discord command received: ${commandName} from ${interaction.user.tag}`,
  );

  try {
    switch (commandName) {
      case "help":
        await handleHelpCommand(interaction);
        break;

      case "status":
        await handleStatusCommand(interaction);
        break;

      case "upgrade":
        await handleUpgradeCommand(interaction);
        break;

      case "signals":
        await handleSignalsCommand(interaction);
        break;

      case "follow":
        await handleFollowCommand(interaction);
        break;

      case "unfollow":
        await handleUnfollowCommand(interaction);
        break;

      case "link":
        await handleLinkCommand(interaction);
        break;

      case "pricing":
        await handlePricingCommand(interaction);
        break;

      case "support":
        await handleSupportCommand(interaction);
        break;

      case "risk":
        await handleRiskCommand(interaction);
        break;

      // ========================================================================
      // COMMANDES ADMIN
      // ========================================================================

      case "admin-sync-roles":
        await handleAdminSyncRoles(interaction);
        break;

      case "admin-stats":
        await handleAdminStats(interaction);
        break;

      case "admin-check-permissions":
        await handleAdminCheckPermissions(interaction);
        break;

      case "admin-bot-info":
        await handleAdminBotInfo(interaction);
        break;

      case "admin-assign-role":
        await handleAdminAssignRole(interaction);
        break;

      case "admin-test-signal":
        await handleAdminTestSignal(interaction);
        break;

      case "admin-test-welcome":
        await handleAdminTestWelcome(interaction);
        break;

      case "admin-trader-channel":
        await handleAdminEnsureTraderChannel(interaction);
        break;

      case "admin-notify":
        await handleAdminNotify(interaction);
        break;

      case "admin-config":
        await handleAdminConfig(interaction);
        break;

      default:
        await interaction.reply({
          content: `❌ Commande inconnue: \`${commandName}\`\n\nUtilise \`/help\` pour voir les commandes disponibles.`,
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error(`Error handling command ${commandName}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Une erreur est survenue";

    // Si l'interaction n'a pas encore été répondue
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ Erreur: ${errorMessage}\n\nContacte le support: ${SiteConfig.team.twitter}`,
        ephemeral: true,
      });
    } else {
      // Si déjà répondue, éditer ou follow-up
      await interaction.followUp({
        content: `❌ Erreur: ${errorMessage}`,
        ephemeral: true,
      });
    }
  }
}
