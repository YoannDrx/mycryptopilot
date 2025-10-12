import {
  ChannelType,
  type Guild,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import { discordBot } from "./bot-client";
import { DISCORD_CONFIG } from "./config";
import { logger } from "../logger";
import { prisma } from "../prisma";

/**
 * Créer un channel privé pour un trader
 *
 * @param traderId - User ID du trader
 * @param traderName - Nom d'affichage du trader
 * @returns Channel ID créé, ou null si erreur
 */
export async function createTraderChannel(
  traderId: string,
  traderName: string,
): Promise<string | null> {
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

    // Trouver ou créer la catégorie "SIGNALS PRIVÉS"
    let category = guild.channels.cache.find(
      (ch) =>
        ch.name === "signals-prives" && ch.type === ChannelType.GuildCategory,
    );

    if (!category) {
      logger.info('Creating "SIGNALS PRIVÉS" category...');
      category = await guild.channels.create({
        name: "signals-prives",
        type: ChannelType.GuildCategory,
        reason: "MyCryptoPilot - Channels privés traders",
      });
    }

    // Nom du channel: trader-{8 premiers chars de l'ID}
    const channelName = `trader-${traderId.slice(0, 8)}`;

    // Vérifier si channel existe déjà
    const existingChannel = guild.channels.cache.find(
      (ch) => ch.name === channelName && ch.parentId === category.id,
    );

    if (existingChannel) {
      logger.warn(`Channel ${channelName} already exists`);
      return existingChannel.id;
    }

    // Récupérer le trader depuis la DB pour son discordId
    const trader = await prisma.user.findUnique({
      where: { id: traderId },
      select: { discordId: true },
    });

    // Permissions du channel
    const permissionOverwrites = [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.ViewChannel], // Caché par défaut
      },
      {
        id: client.user!.id, // Bot
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ];

    // Ajouter permissions pour le trader (view + send)
    if (trader?.discordId) {
      permissionOverwrites.push({
        id: trader.discordId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    }

    // Ajouter permissions pour Admin role
    if (DISCORD_CONFIG.adminRoleId) {
      permissionOverwrites.push({
        id: DISCORD_CONFIG.adminRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels,
        ],
      });
    }

    // Créer le channel
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `Signaux privés de ${traderName} - Accès réservé aux followers`,
      permissionOverwrites,
      reason: `MyCryptoPilot - Channel privé pour trader ${traderName}`,
    });

    logger.info(`✅ Created trader channel: #${channelName} (${channel.id})`);

    // Message de bienvenue
    await channel.send({
      content: [
        `# 🎉 Bienvenue dans le channel privé de ${traderName}!`,
        ``,
        `📬 **Notifications**`,
        `Vous recevrez ici tous les signaux de trading publiés par ${traderName} en temps réel.`,
        ``,
        `💎 **Accès Premium**`,
        `Ce channel est réservé aux followers ayant un plan actif (Pro ou Ultra).`,
        ``,
        `📊 **Bon trading! 🚀**`,
      ].join("\n"),
    });

    return channel.id;
  } catch (error) {
    logger.error(`Error creating trader channel for ${traderId}:`, error);
    return null;
  }
}

/**
 * Ajouter un follower au channel privé d'un trader
 *
 * @param traderId - User ID du trader
 * @param followerDiscordId - Discord ID du follower
 * @returns true si succès
 */
export async function addFollowerToTraderChannel(
  traderId: string,
  followerDiscordId: string,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.error("Discord bot not initialized");
    return false;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found");
      return false;
    }

    // Trouver le channel du trader
    const channelName = `trader-${traderId.slice(0, 8)}`;
    const channel = guild.channels.cache.find(
      (ch) => ch.name === channelName && ch.isTextBased(),
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn(`Trader channel ${channelName} not found`);
      return false;
    }

    // Ajouter permission pour le follower (view only)
    await channel.permissionOverwrites.create(followerDiscordId, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: false, // Read-only pour followers
    });

    logger.info(
      `✅ Added follower ${followerDiscordId} to channel #${channelName}`,
    );

    return true;
  } catch (error) {
    logger.error(`Error adding follower to trader channel:`, error);
    return false;
  }
}

/**
 * Retirer un follower du channel privé d'un trader
 *
 * @param traderId - User ID du trader
 * @param followerDiscordId - Discord ID du follower
 * @returns true si succès
 */
export async function removeFollowerFromTraderChannel(
  traderId: string,
  followerDiscordId: string,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.error("Discord bot not initialized");
    return false;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found");
      return false;
    }

    // Trouver le channel du trader
    const channelName = `trader-${traderId.slice(0, 8)}`;
    const channel = guild.channels.cache.find(
      (ch) => ch.name === channelName && ch.isTextBased(),
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn(`Trader channel ${channelName} not found`);
      return false;
    }

    // Retirer permission du follower
    await channel.permissionOverwrites.delete(followerDiscordId);

    logger.info(
      `✅ Removed follower ${followerDiscordId} from channel #${channelName}`,
    );

    return true;
  } catch (error) {
    logger.error(`Error removing follower from trader channel:`, error);
    return false;
  }
}

/**
 * Archiver le channel d'un trader (quand trader est deleted)
 *
 * @param traderId - User ID du trader
 * @returns true si succès
 */
export async function archiveTraderChannel(
  traderId: string,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.error("Discord bot not initialized");
    return false;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found");
      return false;
    }

    // Trouver le channel du trader
    const channelName = `trader-${traderId.slice(0, 8)}`;
    const channel = guild.channels.cache.find(
      (ch) => ch.name === channelName && ch.isTextBased(),
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn(`Trader channel ${channelName} not found`);
      return false;
    }

    // Trouver ou créer catégorie ARCHIVE
    let archiveCategory = guild.channels.cache.find(
      (ch) => ch.name === "archive" && ch.type === ChannelType.GuildCategory,
    );

    if (!archiveCategory) {
      archiveCategory = await guild.channels.create({
        name: "archive",
        type: ChannelType.GuildCategory,
        reason: "MyCryptoPilot - Archived trader channels",
      });
    }

    // Déplacer vers ARCHIVE
    await channel.setParent(archiveCategory.id);
    await channel.setName(`archived-${channelName}`);

    logger.info(`✅ Archived trader channel: #${channelName}`);

    return true;
  } catch (error) {
    logger.error(`Error archiving trader channel:`, error);
    return false;
  }
}
