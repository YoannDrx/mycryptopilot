import { EmbedBuilder, type TextChannel } from "discord.js";
import { discordBot } from "./bot-client";
import { SiteConfig } from "@/site-config";
import { logger } from "../logger";
import { DISCORD_CONFIG } from "./config";

/**
 * Poster un teaser de signal (flouté) dans #signals-free
 *
 * Pour les users FREE: affiche asset + bias, mais cache entry/tps/invalidation
 * Inclut un CTA pour upgrade vers Pro
 *
 * @param signal - Signal object avec trader et payload
 * @returns true si le message a été envoyé avec succès
 */
export async function postSignalTeaser(signal: {
  id: string;
  symbol: string;
  createdAt: Date;
  payloadJson: unknown;
  trader: {
    id: string;
    name: string;
    traderProfile?: {
      displayName: string;
      verified?: boolean;
    } | null;
  };
}): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.warn("Discord bot not initialized, skipping teaser notification");
    return false;
  }

  // Vérifier que le channel #signals-free est configuré
  const channelId = DISCORD_CONFIG.channels.FREE_SIGNALS;

  if (!channelId) {
    logger.warn(
      "No Discord FREE_SIGNALS channel configured (DISCORD_FREE_SIGNALS_CHANNEL_ID)",
    );
    return false;
  }

  try {
    // Récupérer le guild
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return false;
    }

    // Trouver le channel #signals-free
    const channel = guild.channels.cache.get(channelId) as
      | TextChannel
      | undefined;

    if (!channel) {
      logger.error(
        `Channel #signals-free not found (ID: ${channelId}). Please verify DISCORD_FREE_SIGNALS_CHANNEL_ID in .env`,
      );
      return false;
    }

    // Parser le payload
    const payload = signal.payloadJson as {
      bias?: string;
      entry?: number;
      tps?: number[];
      invalidation?: number;
      confidence?: number;
      risk?: number;
      leverageBand?: string;
      regime?: string;
      managedBy?: string;
    };

    const traderName =
      signal.trader.traderProfile?.displayName ?? signal.trader.name;
    const isVerified = signal.trader.traderProfile?.verified ?? false;

    const bias = payload.bias ?? "UNKNOWN";
    const confidence = payload.confidence ?? 0;
    const risk = payload.risk ?? 0;
    const regime = payload.regime ?? "Unknown";
    const managedBy = payload.managedBy ?? "HUMAN";

    // Couleur selon le bias
    const color = bias === "LONG" ? 0x10b981 : 0xef4444; // Green or Red

    // Créer l'embed avec informations floutées
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(
        `${bias === "LONG" ? "🟢" : "🔴"} ${signal.symbol} - APERÇU GRATUIT`,
      )
      .setDescription(
        `Signal publié par **${traderName}** ${isVerified ? "✅" : ""}\n\n🔒 **Upgrade vers Pro pour voir les détails complets**`,
      )
      .addFields(
        {
          name: "📊 Bias",
          value: `**${bias}**`,
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
          name: "🛑 Invalidation",
          value: "████ 🔒",
          inline: true,
        },
        {
          name: "📈 R/R",
          value: "█.█ 🔒",
          inline: true,
        },
        {
          name: "⚡ Leverage",
          value: "███ 🔒",
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
        {
          name: "🌍 Régime",
          value: regime,
          inline: true,
        },
        {
          name: "🤖 Gestion",
          value: managedBy === "AI" ? "Intelligence Artificielle" : "Humain",
          inline: true,
        },
      )
      .addFields({
        name: "💡 Upgrade vers Pro",
        value:
          "Pour accéder aux **prix d'entrée, targets, invalidation** et jusqu'à **50 signaux/jour**:\n\n" +
          `🔗 [Upgrade maintenant](${SiteConfig.prodUrl}/pricing)`,
        inline: false,
      })
      .setFooter({
        text: `${SiteConfig.title} - Plan FREE - Signal ID: ${signal.id.slice(0, 8)}`,
        iconURL: `${SiteConfig.prodUrl}/images/logo.png`,
      })
      .setTimestamp(signal.createdAt);

    // Envoyer le message dans #signals-free
    await channel.send({ embeds: [embed] });

    logger.info(
      `✅ Signal teaser sent to #signals-free: ${signal.id} (${signal.symbol})`,
    );

    return true;
  } catch (error) {
    logger.error(`Error sending signal teaser to #signals-free:`, error);
    return false;
  }
}

/**
 * Vérifier si un user a un plan FREE (ne devrait voir que des teasers)
 *
 * Utilise getUserSubscription() pour dual-mode support
 *
 * @param userId - User ID
 * @returns true si le user est en plan FREE
 */
export async function isUserFreePlan(userId: string): Promise<boolean> {
  try {
    // Importer dynamiquement pour éviter circular deps
    const { getUserSubscription } = await import(
      "../subscription/get-user-subscription"
    );

    // Récupérer la subscription (dual-mode)
    const subscription = await getUserSubscription(userId);

    // Si plan = "free" ou status n'est pas actif, retourner true
    return subscription.plan === "free";
  } catch (error) {
    logger.error("Error checking if user is FREE plan:", error);
    // En cas d'erreur, considérer comme FREE par sécurité
    return true;
  }
}
