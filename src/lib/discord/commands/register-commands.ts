import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

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

    // ========================================================================
    // COMMANDES ADMIN (Réservées aux administrateurs)
    // ========================================================================

    // Commande /admin-sync-roles
    new SlashCommandBuilder()
      .setName("admin-sync-roles")
      .setDescription("[ADMIN] Synchroniser les rôles Discord (Free/Pro/Ultra)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    // Commande /admin-stats
    new SlashCommandBuilder()
      .setName("admin-stats")
      .setDescription("[ADMIN] Statistiques du serveur et du bot")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    // Commande /admin-check-permissions
    new SlashCommandBuilder()
      .setName("admin-check-permissions")
      .setDescription("[ADMIN] Vérifier les permissions du bot")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    // Commande /admin-bot-info
    new SlashCommandBuilder()
      .setName("admin-bot-info")
      .setDescription("[ADMIN] Informations détaillées sur le bot")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    // Commande /admin-assign-role
    new SlashCommandBuilder()
      .setName("admin-assign-role")
      .setDescription("[ADMIN] Assigner manuellement un rôle à un utilisateur")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("L'utilisateur à qui assigner le rôle")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("plan")
          .setDescription("Le plan à assigner")
          .setRequired(true)
          .addChoices(
            { name: "🟢 Free Member", value: "free" },
            { name: "🟡 Pro Trader", value: "pro" },
            { name: "🟣 Ultra Trader", value: "ultra" },
          ),
      )
      .toJSON(),

    // Commande /admin-test-signal
    new SlashCommandBuilder()
      .setName("admin-test-signal")
      .setDescription("[ADMIN] Envoyer un signal test dans #signals-free")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),
  ];
}
