import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { logger } from "@/lib/logger";
import { discordBot } from "../bot-client";
import { ensureRolesExist } from "../roles";
import { DISCORD_CONFIG } from "../config";
import { SiteConfig } from "@/site-config";
import { assignRoleToUser } from "../roles";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Commandes Admin Discord
 *
 * Commandes réservées aux administrateurs pour gérer le bot
 * Sécurité: PermissionFlagsBits.Administrator requis
 */

/**
 * Vérifier si l'utilisateur est admin
 */
function isUserAdmin(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;
  if (!member || !("permissions" in member)) return false;

  // Check Discord Administrator permission
  if (
    typeof member.permissions !== "string" &&
    member.permissions.has("Administrator")
  )
    return true;

  // Check custom admin role
  if (DISCORD_CONFIG.adminRoleId && "roles" in member) {
    const roles = member.roles;
    if ("cache" in roles) {
      return roles.cache.has(DISCORD_CONFIG.adminRoleId);
    }
  }

  return false;
}

/**
 * /admin-sync-roles - Synchroniser les rôles Discord
 */
export async function handleAdminSyncRoles(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply("❌ Impossible de récupérer le serveur.");
      return;
    }

    logger.info(`Admin ${interaction.user.tag} triggered role synchronization`);
    await ensureRolesExist(guild);

    const embed = new EmbedBuilder()
      .setColor(0x10b981) // Green
      .setTitle("✅ Rôles Synchronisés")
      .setDescription("Les rôles Discord ont été créés/mis à jour avec succès.")
      .addFields(
        {
          name: "🟢 Free Member",
          value: "Créé/Vérifié",
          inline: true,
        },
        {
          name: "🟡 Pro Trader",
          value: "Créé/Vérifié",
          inline: true,
        },
        {
          name: "🟣 Ultra Trader",
          value: "Créé/Vérifié",
          inline: true,
        },
      )
      .setFooter({ text: `Exécuté par ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error in handleAdminSyncRoles:", error);
    await interaction.editReply(
      "❌ Erreur lors de la synchronisation des rôles.",
    );
  }
}

/**
 * /admin-stats - Statistiques du serveur
 */
export async function handleAdminStats(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply("❌ Impossible de récupérer le serveur.");
      return;
    }

    const client = discordBot.getClient();
    if (!client?.user) {
      await interaction.editReply("❌ Bot non initialisé.");
      return;
    }

    // Fetch guild data
    await guild.members.fetch();

    // Count roles
    const roleCount = guild.roles.cache.size;
    const mycryptopilotRoles = guild.roles.cache.filter((r) =>
      (Object.values(DISCORD_CONFIG.roles) as string[]).includes(r.name),
    );

    // Count channels
    const textChannels = guild.channels.cache.filter(
      (c) => c.type === 0, // GuildText
    ).size;
    const voiceChannels = guild.channels.cache.filter(
      (c) => c.type === 2, // GuildVoice
    ).size;

    // Member stats
    const totalMembers = guild.memberCount;
    const botMembers = guild.members.cache.filter((m) => m.user.bot).size;
    const humanMembers = totalMembers - botMembers;

    // Role distribution
    const freeMembers = guild.members.cache.filter((m) =>
      m.roles.cache.some((r) => r.name === DISCORD_CONFIG.roles.FREE),
    ).size;
    const proMembers = guild.members.cache.filter((m) =>
      m.roles.cache.some((r) => r.name === DISCORD_CONFIG.roles.PRO),
    ).size;
    const ultraMembers = guild.members.cache.filter((m) =>
      m.roles.cache.some((r) => r.name === DISCORD_CONFIG.roles.ULTRA),
    ).size;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6) // Blue
      .setTitle(`📊 Statistiques - ${guild.name}`)
      .setThumbnail(guild.iconURL() ?? null)
      .addFields(
        {
          name: "👥 Membres",
          value: [
            `Total: **${totalMembers}**`,
            `Humains: **${humanMembers}**`,
            `Bots: **${botMembers}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🎭 Rôles",
          value: [
            `Total: **${roleCount}**`,
            `MCP Roles: **${mycryptopilotRoles.size}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "📺 Channels",
          value: [
            `Texte: **${textChannels}**`,
            `Vocal: **${voiceChannels}**`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "💎 Distribution Plans",
          value: [
            `🟢 Free: **${freeMembers}**`,
            `🟡 Pro: **${proMembers}**`,
            `🟣 Ultra: **${ultraMembers}**`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "🤖 Bot",
          value: [
            `Nom: **${client.user.tag}**`,
            `ID: \`${client.user.id}\``,
            `Ping: **${client.ws.ping}ms**`,
          ].join("\n"),
          inline: false,
        },
      )
      .setFooter({ text: `Serveur ID: ${guild.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error in handleAdminStats:", error);
    await interaction.editReply("❌ Erreur lors de la récupération des stats.");
  }
}

/**
 * /admin-check-permissions - Vérifier les permissions du bot
 */
export async function handleAdminCheckPermissions(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply("❌ Impossible de récupérer le serveur.");
      return;
    }

    const client = discordBot.getClient();
    if (!client?.user) {
      await interaction.editReply("❌ Bot non initialisé.");
      return;
    }

    const botMember = await guild.members.fetch(client.user.id);

    const requiredPermissions = [
      { flag: "ManageRoles", name: "Gérer les rôles", critical: true },
      { flag: "ManageChannels", name: "Gérer les channels", critical: true },
      {
        flag: "CreateInstantInvite",
        name: "Créer des invitations",
        critical: true,
      },
      { flag: "SendMessages", name: "Envoyer des messages", critical: true },
      { flag: "EmbedLinks", name: "Liens intégrés", critical: false },
      {
        flag: "ReadMessageHistory",
        name: "Lire l'historique",
        critical: false,
      },
      {
        flag: "ModerateMembers",
        name: "Modérer les membres",
        critical: false,
      },
      { flag: "ViewAuditLog", name: "Voir l'audit log", critical: false },
      {
        flag: "ManageMessages",
        name: "Gérer les messages",
        critical: false,
      },
    ];

    const permissionResults = requiredPermissions.map((perm) => {
      const hasPermission = botMember.permissions.has(perm.flag as never);
      const emoji = hasPermission ? "✅" : perm.critical ? "❌" : "⚠️";
      return `${emoji} ${perm.name}${perm.critical ? " (CRITIQUE)" : ""}`;
    });

    const hasCriticalMissing = requiredPermissions.some(
      (perm) => perm.critical && !botMember.permissions.has(perm.flag as never),
    );

    const embed = new EmbedBuilder()
      .setColor(hasCriticalMissing ? 0xef4444 : 0x10b981) // Red or Green
      .setTitle(
        hasCriticalMissing
          ? "⚠️ Permissions Manquantes"
          : "✅ Toutes les Permissions OK",
      )
      .setDescription(permissionResults.join("\n"))
      .setFooter({ text: `Bot: ${client.user.tag}` })
      .setTimestamp();

    if (hasCriticalMissing) {
      embed.addFields({
        name: "🔧 Comment réparer?",
        value:
          "Donne au bot le rôle **Administrator** ou assure-toi qu'il a toutes les permissions critiques.",
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error in handleAdminCheckPermissions:", error);
    await interaction.editReply(
      "❌ Erreur lors de la vérification des permissions.",
    );
  }
}

/**
 * /admin-bot-info - Informations détaillées sur le bot
 */
export async function handleAdminBotInfo(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const client = discordBot.getClient();
    if (!client?.user) {
      await interaction.editReply("❌ Bot non initialisé.");
      return;
    }

    const uptime = client.uptime ?? 0;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor(uptime / 3600000) % 24;
    const minutes = Math.floor(uptime / 60000) % 60;
    const uptimeString = `${days}j ${hours}h ${minutes}m`;

    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6) // Purple
      .setTitle(`🤖 ${SiteConfig.title} Bot`)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        {
          name: "📝 Nom",
          value: `**${client.user.tag}**`,
          inline: true,
        },
        {
          name: "🆔 ID",
          value: `\`${client.user.id}\``,
          inline: true,
        },
        {
          name: "📡 Ping",
          value: `**${client.ws.ping}ms**`,
          inline: true,
        },
        {
          name: "⏰ Uptime",
          value: `**${uptimeString}**`,
          inline: true,
        },
        {
          name: "💾 Mémoire",
          value: `**${memoryMB} MB**`,
          inline: true,
        },
        {
          name: "🌐 Serveurs",
          value: `**${client.guilds.cache.size}**`,
          inline: true,
        },
        {
          name: "📋 Environnement",
          value: [
            `Node: **${process.version}**`,
            `Platform: **${process.platform}**`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "⚙️ Configuration",
          value: [
            `Enabled: **${DISCORD_CONFIG.isEnabled() ? "✅" : "❌"}**`,
            `Guild ID: \`${process.env.DISCORD_GUILD_ID ?? "N/A"}\``,
            `Free Signals Channel: \`${DISCORD_CONFIG.channels.FREE_SIGNALS || "N/A"}\``,
            `Logs Channel: \`${DISCORD_CONFIG.channels.LOGS || "N/A"}\``,
          ].join("\n"),
          inline: false,
        },
      )
      .setFooter({ text: `MyCryptoPilot Bot v1.0.0` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Error in handleAdminBotInfo:", error);
    await interaction.editReply(
      "❌ Erreur lors de la récupération des infos du bot.",
    );
  }
}

/**
 * /admin-assign-role - Assigner manuellement un rôle à un utilisateur
 */
export async function handleAdminAssignRole(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const targetUser = interaction.options.getUser("user", true);
    const plan = interaction.options.getString(
      "plan",
      true,
    ) as MyCryptoPilotPlanName;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply("❌ Impossible de récupérer le serveur.");
      return;
    }

    // Vérifier que l'utilisateur est dans le serveur
    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      await interaction.editReply(
        `❌ L'utilisateur ${targetUser.tag} n'est pas dans ce serveur.`,
      );
      return;
    }

    logger.info(
      `Admin ${interaction.user.tag} assigning role ${plan} to ${targetUser.tag}`,
    );

    const success = await assignRoleToUser(targetUser.id, plan);

    if (success) {
      const planEmoji = plan === "free" ? "🟢" : plan === "pro" ? "🟡" : "🟣";
      const planName =
        plan === "free"
          ? "Free Member"
          : plan === "pro"
            ? "Pro Trader"
            : "Ultra Trader";

      const embed = new EmbedBuilder()
        .setColor(0x10b981) // Green
        .setTitle("✅ Rôle Assigné")
        .setDescription(
          `Le rôle ${planEmoji} **${planName}** a été assigné à ${targetUser}.`,
        )
        .addFields({
          name: "👤 Utilisateur",
          value: `${targetUser.tag} (\`${targetUser.id}\`)`,
        })
        .setFooter({ text: `Exécuté par ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply(
        "❌ Erreur lors de l'assignation du rôle. Vérifiez les logs.",
      );
    }
  } catch (error) {
    logger.error("Error in handleAdminAssignRole:", error);
    await interaction.editReply("❌ Erreur lors de l'assignation du rôle.");
  }
}

/**
 * /admin-test-signal - Envoyer un signal test dans #signals-free
 */
export async function handleAdminTestSignal(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const client = discordBot.getClient();
    if (!client) {
      await interaction.editReply("❌ Bot non initialisé.");
      return;
    }

    const channelId = DISCORD_CONFIG.channels.FREE_SIGNALS;
    if (!channelId) {
      await interaction.editReply(
        "❌ DISCORD_FREE_SIGNALS_CHANNEL_ID non configuré.",
      );
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !("send" in channel)) {
      await interaction.editReply(
        "❌ Impossible de récupérer le channel #signals-free.",
      );
      return;
    }

    logger.info(
      `Admin ${interaction.user.tag} triggered test signal in #signals-free`,
    );

    // Créer un signal test
    const testEmbed = new EmbedBuilder()
      .setColor(0xf59e0b) // Amber
      .setTitle("🧪 SIGNAL TEST - BTC/USDT")
      .setDescription(
        "Ceci est un signal de test envoyé par un administrateur.\n\n🔒 **Les détails complets sont floutés pour les membres Free**",
      )
      .addFields(
        {
          name: "📊 Bias",
          value: "**LONG** 🟢",
          inline: true,
        },
        {
          name: "💰 Entry",
          value: "████ 🔒",
          inline: true,
        },
        {
          name: "🎯 TP1",
          value: "████ 🔒",
          inline: true,
        },
        {
          name: "🛡️ Stop Loss",
          value: "████ 🔒",
          inline: true,
        },
        {
          name: "📈 Take Profits",
          value: "████ 🔒\n████ 🔒\n████ 🔒",
          inline: true,
        },
        {
          name: "⚖️ Leverage",
          value: "████ 🔒",
          inline: true,
        },
      )
      .setFooter({
        text: `Test par ${interaction.user.tag} | Upgrade pour voir les signaux complets`,
      })
      .setTimestamp();

    await channel.send({ embeds: [testEmbed] });

    await interaction.editReply("✅ Signal test envoyé dans #signals-free!");
  } catch (error) {
    logger.error("Error in handleAdminTestSignal:", error);
    await interaction.editReply("❌ Erreur lors de l'envoi du signal test.");
  }
}

/**
 * /admin-test-welcome - Tester le message de bienvenue en s'envoyant le DM
 */
export async function handleAdminTestWelcome(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!isUserAdmin(interaction)) {
    await interaction.reply({
      content: "❌ Cette commande est réservée aux administrateurs.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    logger.info(`Admin ${interaction.user.tag} triggered test welcome message`);

    // Importer la fonction de message de bienvenue
    const { sendWelcomeMessage } = await import("../dm-notifications");

    // Envoyer le message de bienvenue à l'admin qui a exécuté la commande
    const success = await sendWelcomeMessage(
      interaction.user.id,
      interaction.user.username,
    );

    if (success) {
      const embed = new EmbedBuilder()
        .setColor(0x10b981) // Green
        .setTitle("✅ Message de Bienvenue Envoyé")
        .setDescription(
          `Le message de bienvenue a été envoyé en DM à ${interaction.user}.\n\n` +
            `Vérifie tes messages privés pour voir le résultat ! 📬`,
        )
        .setFooter({
          text: `Testé par ${interaction.user.tag}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply(
        "❌ Erreur lors de l'envoi du message de bienvenue. Vérifie que tes DM sont ouverts.",
      );
    }
  } catch (error) {
    logger.error("Error in handleAdminTestWelcome:", error);
    await interaction.editReply(
      "❌ Erreur lors de l'envoi du message de bienvenue.",
    );
  }
}
