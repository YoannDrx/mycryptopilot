import { SlashCommandBuilder } from "discord.js";

/**
 * Définition des commandes slash Discord
 */
export function registerCommands() {
  return [
    // Commande /help
    new SlashCommandBuilder()
      .setName("help")
      .setDescription("Affiche la liste des commandes disponibles")
      .toJSON(),

    // Commande /status
    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Affiche le statut de votre abonnement MyCryptoPilot")
      .toJSON(),

    // Commande /upgrade
    new SlashCommandBuilder()
      .setName("upgrade")
      .setDescription("Obtenir le lien pour upgrader votre abonnement")
      .toJSON(),

    // Commande /signals
    new SlashCommandBuilder()
      .setName("signals")
      .setDescription(
        "Affiche les 5 derniers signaux des traders que vous suivez",
      )
      .toJSON(),

    // Commande /follow
    new SlashCommandBuilder()
      .setName("follow")
      .setDescription("Suivre un trader pour recevoir ses signaux")
      .addUserOption((option) =>
        option
          .setName("trader")
          .setDescription("Le trader à suivre")
          .setRequired(true),
      )
      .toJSON(),
  ];
}
