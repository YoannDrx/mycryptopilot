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

    // Commande /unfollow
    new SlashCommandBuilder()
      .setName("unfollow")
      .setDescription("Se désabonner d'un trader")
      .addUserOption((option) =>
        option
          .setName("trader")
          .setDescription("Le trader à arrêter de suivre")
          .setRequired(true),
      )
      .toJSON(),

    // Commande /link
    new SlashCommandBuilder()
      .setName("link")
      .setDescription("Vérifier ou connecter ton compte Discord à MyCryptoPilot")
      .toJSON(),

    // Commande /pricing
    new SlashCommandBuilder()
      .setName("pricing")
      .setDescription("Afficher les plans et le lien de paiement crypto")
      .toJSON(),

    // Commande /support
    new SlashCommandBuilder()
      .setName("support")
      .setDescription("Obtenir les contacts support de MyCryptoPilot")
      .toJSON(),

    // Commande /risk
    new SlashCommandBuilder()
      .setName("risk")
      .setDescription("Calculer la taille de position avec la règle des 2%")
      .addNumberOption((option) =>
        option
          .setName("capital")
          .setDescription("Capital total en dollars")
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName("entry")
          .setDescription("Prix d'entrée")
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName("stop")
          .setDescription("Stop loss")
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName("takeprofit")
          .setDescription("Take profit principal")
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName("riskpercent")
          .setDescription("% de capital à risquer (par défaut 2)")
          .setRequired(false),
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

    // Commande /admin-test-welcome
    new SlashCommandBuilder()
      .setName("admin-test-welcome")
      .setDescription(
        "[ADMIN] Tester le message de bienvenue en s'envoyant le DM",
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),

    // Commande /admin-trader-channel
    new SlashCommandBuilder()
      .setName("admin-trader-channel")
      .setDescription("[ADMIN] Créer ou vérifier le channel privé d'un trader")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption((option) =>
        option
          .setName("trader")
          .setDescription("Trader dont il faut vérifier le channel")
          .setRequired(true),
      )
      .toJSON(),

    // Commande /admin-notify
    new SlashCommandBuilder()
      .setName("admin-notify")
      .setDescription("[ADMIN] Envoyer une annonce dans un channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Message à envoyer")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("channel")
          .setDescription("ID du channel cible (optionnel)"),
      )
      .toJSON(),

    // Commande /admin-config
    new SlashCommandBuilder()
      .setName("admin-config")
      .setDescription("[ADMIN] Voir la configuration du bot")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .toJSON(),
  ];
}
