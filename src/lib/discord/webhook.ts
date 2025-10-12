import { EmbedBuilder, type TextChannel } from "discord.js";
import { discordBot } from "./bot-client";
import { SiteConfig } from "@/site-config";
import { logger } from "../logger";
import { env } from "../env";
import { notifyFollowerNewSignal } from "./dm-notifications";
import { prisma } from "../prisma";
import { postSignalTeaser } from "./signals-free";

/**
 * Envoyer une notification Discord pour un nouveau signal
 *
 * @param signal - Signal object avec trader et payload
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyNewSignal(signal: {
  id: string;
  symbol: string;
  createdAt: Date;
  payloadJson: unknown;
  trader: {
    id: string;
    name: string;
    traderProfile?: {
      displayName: string;
    } | null;
  };
}): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.warn("Discord bot not initialized, skipping signal notification");
    return false;
  }

  // Récupérer le channel de notification (configurable via env)
  const channelId = env.DISCORD_GUILD_ID; // TODO: Créer une var DISCORD_SIGNALS_CHANNEL_ID

  if (!channelId) {
    logger.warn("No Discord channel configured for signal notifications");
    return false;
  }

  try {
    // Récupérer le channel
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return false;
    }

    // Trouver le channel privé du trader (Phase 2.4)
    const traderChannelName = `trader-${signal.trader.id.slice(0, 8)}`;
    let channel = guild.channels.cache.find(
      (ch) => ch.name === traderChannelName && ch.isTextBased(),
    ) as TextChannel | undefined;

    // Fallback: Si channel trader pas trouvé, utiliser #signals global
    if (!channel) {
      logger.warn(
        `Trader channel ${traderChannelName} not found, using #signals as fallback`,
      );

      channel = guild.channels.cache.find(
        (ch) => ch.name === "signals" && ch.isTextBased(),
      ) as TextChannel | undefined;

      if (!channel) {
        // Créer le channel signals s'il n'existe pas
        logger.info("Creating #signals channel as fallback...");
        channel = await guild.channels.create({
          name: "signals",
          type: 0, // Text channel
          topic: "Trading signals from MyCryptoPilot verified traders (fallback)",
        });
        logger.info("✅ #signals channel created");
      }
    }

    // Formatter le signal
    const payload = signal.payloadJson as {
      bias?: string;
      entry?: number;
      tps?: number[];
      invalidation?: number;
      confidence?: number;
      risk?: number;
      leverageBand?: string;
      rationales?: string[];
    };

    const traderName =
      signal.trader.traderProfile?.displayName ?? signal.trader.name;

    const bias = payload.bias ?? "UNKNOWN";
    const entry = payload.entry ?? 0;
    const tps = payload.tps ?? [];
    const invalidation = payload.invalidation ?? 0;
    const confidence = payload.confidence ?? 0;
    const risk = payload.risk ?? 0;
    const leverageBand = payload.leverageBand ?? "1x-3x";
    const rationales = payload.rationales ?? [];

    // Calculer le risque/récompense
    const tp1 = tps[0] ?? 0;
    const riskReward =
      invalidation !== 0
        ? Math.abs((tp1 - entry) / (entry - invalidation)).toFixed(2)
        : "N/A";

    // Couleur selon le bias
    const color = bias === "LONG" ? 0x10b981 : 0xef4444; // Green or Red

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(
        `${bias === "LONG" ? "🟢" : "🔴"} NOUVEAU SIGNAL: ${signal.symbol}`,
      )
      .setDescription(`Signal publié par **${traderName}**`)
      .addFields(
        {
          name: "📊 Bias",
          value: `**${bias}**`,
          inline: true,
        },
        {
          name: "💰 Entry",
          value: `${entry}`,
          inline: true,
        },
        {
          name: "🎯 TP1",
          value: `${tp1}`,
          inline: true,
        },
        {
          name: "🛑 Invalidation",
          value: `${invalidation}`,
          inline: true,
        },
        {
          name: "📈 R/R",
          value: `${riskReward}`,
          inline: true,
        },
        {
          name: "⚡ Leverage",
          value: leverageBand,
          inline: true,
        },
        {
          name: "🎲 Confiance",
          value: `${confidence}%`,
          inline: true,
        },
        {
          name: "⚠️ Risque",
          value: `${risk}/5`,
          inline: true,
        },
      )
      .setFooter({
        text: `${SiteConfig.title} - Signal ID: ${signal.id.slice(0, 8)}`,
      })
      .setTimestamp(signal.createdAt);

    // Ajouter les TPs supplémentaires s'il y en a
    if (tps.length > 1) {
      const otherTps = tps
        .slice(1)
        .map((tp, i) => `TP${i + 2}: ${tp}`)
        .join(" | ");
      embed.addFields({
        name: "🎯 Autres TPs",
        value: otherTps,
        inline: false,
      });
    }

    // Ajouter les rationales s'il y en a
    if (rationales.length > 0) {
      embed.addFields({
        name: "💡 Rationales",
        value: rationales.map((r, i) => `${i + 1}. ${r}`).join("\n"),
        inline: false,
      });
    }

    // Envoyer le message dans le channel privé du trader (ou #signals fallback)
    await channel.send({ embeds: [embed] });

    logger.info(
      `✅ Signal notification sent to ${channel.name}: ${signal.id}`,
    );

    // Poster aussi un teaser dans #signals-free (Phase 4.2 - non-bloquant)
    void postSignalTeaser(signal).catch((err) => {
      logger.error("Failed to post signal teaser to #signals-free:", err);
      // Ne pas bloquer si le teaser échoue
    });

    // Envoyer des DMs aux followers de ce trader qui ont activé les notifications
    try {
      // Récupérer tous les followers de ce trader avec leur discordId
      const followers = await prisma.follow.findMany({
        where: {
          traderId: signal.trader.id,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              discordId: true,
            },
          },
        },
      });

      // Envoyer un DM à chaque follower (en parallèle pour performance)
      const followersWithDiscord = followers.filter(
        (f): f is typeof f & { user: { discordId: string } } =>
          !!f.user.discordId,
      );

      await Promise.allSettled(
        followersWithDiscord.map(async (follower) =>
          notifyFollowerNewSignal(follower.user.discordId, signal),
        ),
      );

      logger.info(
        `📬 Sent DM notifications to ${followers.length} followers for signal ${signal.id}`,
      );
    } catch (dmError) {
      logger.error(`Error sending DM notifications:`, dmError);
      // Ne pas bloquer si les DMs échouent
    }

    return true;
  } catch (error) {
    logger.error(`Error sending signal notification:`, error);
    return false;
  }
}

/**
 * Envoyer un message de mise à jour pour un signal (TP hit, invalidation, etc.)
 *
 * @param signal - Signal object avec status update
 * @param status - Status du signal ("TP_HIT", "INVALIDATED", etc.)
 */
export async function notifySignalUpdate(
  signalId: string,
  symbol: string,
  traderName: string,
  status: "TP_HIT" | "INVALIDATED" | "UPDATED",
  message?: string,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.warn(
      "Discord bot not initialized, skipping signal update notification",
    );
    return false;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return false;
    }

    const channel = guild.channels.cache.find(
      (ch) => ch.name === "signals" && ch.isTextBased(),
    ) as TextChannel | undefined;

    if (!channel) {
      logger.warn("No #signals channel found");
      return false;
    }

    // Couleur et emoji selon le status
    const statusConfig = {
      TP_HIT: { color: 0x10b981, emoji: "✅", text: "TP HIT" },
      INVALIDATED: { color: 0xef4444, emoji: "❌", text: "INVALIDÉ" },
      UPDATED: { color: 0xf59e0b, emoji: "📝", text: "MIS À JOUR" },
    };

    const config = statusConfig[status];

    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setTitle(`${config.emoji} ${symbol} - ${config.text}`)
      .setDescription(`Signal de **${traderName}**`)
      .setFooter({
        text: `${SiteConfig.title} - Signal ID: ${signalId.slice(0, 8)}`,
      })
      .setTimestamp();

    if (message) {
      embed.addFields({
        name: "ℹ️ Détails",
        value: message,
        inline: false,
      });
    }

    await channel.send({ embeds: [embed] });

    logger.info(`✅ Signal update notification sent: ${signalId} - ${status}`);

    return true;
  } catch (error) {
    logger.error(`Error sending signal update notification:`, error);
    return false;
  }
}
