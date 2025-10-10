import { EmbedBuilder } from "discord.js";
import { discordBot } from "./bot-client";
import { SiteConfig } from "@/site-config";
import { logger } from "../logger";

/**
 * Envoyer un message privé (DM) à un utilisateur Discord
 *
 * @param discordUserId - Discord User ID
 * @param embed - Embed à envoyer
 * @returns true si le message a été envoyé avec succès
 */
async function sendDM(
  discordUserId: string,
  embed: EmbedBuilder,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.warn("Discord bot not initialized, skipping DM notification");
    return false;
  }

  try {
    const user = await client.users.fetch(discordUserId);
    await user.send({ embeds: [embed] });

    logger.info(`✅ DM sent to ${user.tag}`);

    return true;
  } catch (error) {
    logger.error(`Error sending DM to ${discordUserId}:`, error);
    return false;
  }
}

/**
 * Notifier un utilisateur en DM qu'un nouveau signal a été publié par un trader qu'il suit
 *
 * @param discordUserId - Discord User ID du follower
 * @param signal - Signal object avec trader et payload
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyFollowerNewSignal(
  discordUserId: string,
  signal: {
    id: string;
    symbol: string;
    createdAt: Date;
    payloadJson: unknown;
    trader: {
      name: string;
      traderProfile?: {
        displayName: string;
        verified?: boolean;
      } | null;
    };
  },
): Promise<boolean> {
  const payload = signal.payloadJson as {
    bias?: string;
    entry?: number;
    tps?: number[];
    invalidation?: number;
    confidence?: number;
    risk?: number;
  };

  const traderName =
    signal.trader.traderProfile?.displayName ?? signal.trader.name;
  const verified = signal.trader.traderProfile?.verified ?? false;

  const bias = payload.bias ?? "UNKNOWN";
  const entry = payload.entry ?? 0;
  const tp1 = payload.tps?.[0] ?? 0;
  const invalidation = payload.invalidation ?? 0;
  const confidence = payload.confidence ?? 0;
  const risk = payload.risk ?? 0;

  // Calculer le risque/récompense
  const riskReward =
    invalidation !== 0
      ? Math.abs((tp1 - entry) / (entry - invalidation)).toFixed(2)
      : "N/A";

  // Couleur selon le bias
  const color = bias === "LONG" ? 0x10b981 : 0xef4444; // Green or Red

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(
      `${bias === "LONG" ? "🟢" : "🔴"} Nouveau signal: ${signal.symbol}`,
    )
    .setDescription(
      `**${traderName}** ${verified ? "✓" : ""} a publié un nouveau signal !`,
    )
    .addFields(
      {
        name: "📊 Setup",
        value: `**${bias}** @ ${entry}\nTP1: ${tp1} | SL: ${invalidation}`,
        inline: false,
      },
      {
        name: "📈 R/R",
        value: `${riskReward}`,
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
      text: `${SiteConfig.title} - Clique pour plus de détails`,
    })
    .setTimestamp(signal.createdAt);

  // Ajouter un lien vers le site
  embed.addFields({
    name: "🔗 Voir sur le site",
    value: `${SiteConfig.prodUrl}/signals/${signal.id}`,
    inline: false,
  });

  return sendDM(discordUserId, embed);
}

/**
 * Notifier un utilisateur en DM qu'un trader qu'il suit a mis à jour un signal
 *
 * @param discordUserId - Discord User ID du follower
 * @param signalId - ID du signal
 * @param symbol - Symbole du signal (BTC-USDT, etc.)
 * @param traderName - Nom du trader
 * @param status - Status du signal ("TP_HIT", "INVALIDATED", "UPDATED")
 * @param message - Message optionnel
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyFollowerSignalUpdate(
  discordUserId: string,
  signalId: string,
  symbol: string,
  traderName: string,
  status: "TP_HIT" | "INVALIDATED" | "UPDATED",
  message?: string,
): Promise<boolean> {
  // Couleur et emoji selon le status
  const statusConfig = {
    TP_HIT: {
      color: 0x10b981,
      emoji: "✅",
      text: "TP HIT",
      title: "🎯 Take Profit atteint !",
    },
    INVALIDATED: {
      color: 0xef4444,
      emoji: "❌",
      text: "INVALIDÉ",
      title: "❌ Signal invalidé",
    },
    UPDATED: {
      color: 0xf59e0b,
      emoji: "📝",
      text: "MIS À JOUR",
      title: "📝 Signal mis à jour",
    },
  };

  const config = statusConfig[status];

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setTitle(config.title)
    .setDescription(
      `Signal **${symbol}** de **${traderName}** : ${config.text}`,
    )
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

  // Ajouter un lien vers le site
  embed.addFields({
    name: "🔗 Voir sur le site",
    value: `${SiteConfig.prodUrl}/signals/${signalId}`,
    inline: false,
  });

  return sendDM(discordUserId, embed);
}

/**
 * Notifier un utilisateur en DM qu'il a atteint sa limite de traders suivis
 *
 * @param discordUserId - Discord User ID
 * @param currentPlan - Plan actuel ("free", "pro", "ultra")
 * @param limit - Limite de traders
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyFollowLimitReached(
  discordUserId: string,
  currentPlan: string,
  limit: number,
): Promise<boolean> {
  const embed = new EmbedBuilder()
    .setColor(0xf59e0b) // Amber
    .setTitle("⚠️ Limite atteinte")
    .setDescription(
      `Tu as atteint la limite de **${limit} trader(s)** pour ton plan **${currentPlan.toUpperCase()}**.\n\n` +
        `Upgrade ton plan pour suivre plus de traders et recevoir plus de signaux !`,
    )
    .addFields(
      {
        name: "💎 Plan PRO - 49$/mois",
        value: `Suis jusqu'à **5 traders** et reçois **50 signaux/jour**`,
        inline: false,
      },
      {
        name: "🚀 Plan ULTRA - 99$/mois",
        value: `Suis **tous les traders** et reçois des **signaux illimités**`,
        inline: false,
      },
    )
    .addFields({
      name: "🔗 Upgrader",
      value: `${SiteConfig.prodUrl}/pricing`,
      inline: false,
    })
    .setFooter({
      text: `${SiteConfig.title}`,
    })
    .setTimestamp();

  return sendDM(discordUserId, embed);
}

/**
 * Notifier un utilisateur en DM que son plan a été mis à jour
 *
 * @param discordUserId - Discord User ID
 * @param newPlan - Nouveau plan ("free", "pro", "ultra")
 * @param expiresAt - Date d'expiration (optionnel)
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyPlanUpdated(
  discordUserId: string,
  newPlan: string,
  expiresAt?: Date,
): Promise<boolean> {
  const planColors = {
    free: 0x6b7280, // Gray
    pro: 0xf59e0b, // Amber
    ultra: 0x8b5cf6, // Purple
  };

  const planEmojis = {
    free: "🆓",
    pro: "💎",
    ultra: "🚀",
  };

  const color =
    newPlan in planColors
      ? planColors[newPlan as keyof typeof planColors]
      : 0x6b7280;
  const emoji =
    newPlan in planEmojis
      ? planEmojis[newPlan as keyof typeof planEmojis]
      : "🆓";

  const expirationText = expiresAt
    ? `\n📅 Expire le: ${new Date(expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`
    : "";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} Plan mis à jour !`)
    .setDescription(
      `Ton plan a été mis à jour vers **${newPlan.toUpperCase()}** !${expirationText}\n\n` +
        `Profite de tes nouveaux avantages dès maintenant ! 🎉`,
    )
    .addFields({
      name: "📊 Vérifier ton statut",
      value: `Utilise la commande \`/status\` sur Discord`,
      inline: false,
    })
    .setFooter({
      text: `${SiteConfig.title}`,
    })
    .setTimestamp();

  return sendDM(discordUserId, embed);
}

/**
 * Notifier un utilisateur en DM que son abonnement expire bientôt
 *
 * @param discordUserId - Discord User ID
 * @param planName - Plan actuel ("free", "pro", "ultra")
 * @param daysLeft - Nombre de jours restants
 * @param expiresAt - Date d'expiration
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyExpirationReminder(
  discordUserId: string,
  planName: string,
  daysLeft: number,
  expiresAt: Date,
): Promise<boolean> {
  const planDisplayName =
    planName === "pro" ? "Pro" : planName === "ultra" ? "Ultra" : "Free";

  const urgencyText =
    daysLeft === 3 ? "dans 3 jours" : daysLeft === 1 ? "demain" : "bientôt";

  const urgencyColor = daysLeft === 1 ? 0xef4444 : 0xf59e0b; // Red if 1 day, Amber if 3 days

  const embed = new EmbedBuilder()
    .setColor(urgencyColor)
    .setTitle(`⏰ Ton abonnement ${planDisplayName} expire ${urgencyText}`)
    .setDescription(
      `Ton abonnement **${planDisplayName}** expire le **${expiresAt.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}**.\n\n` +
        `**Il te reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""} pour renouveler** et continuer à profiter de tes avantages ! 🚀`,
    )
    .addFields(
      {
        name: "⚠️ Que se passe-t-il après expiration ?",
        value:
          `Si tu ne renouvelles pas avant l'expiration :\n` +
          `• Ton compte sera downgraded vers le plan **Free**\n` +
          `• Tu perdras l'accès aux fonctionnalités premium\n` +
          `• Tes données seront conservées (tu peux upgrader à tout moment)`,
        inline: false,
      },
      {
        name: "🔄 Comment renouveler ?",
        value: `Visite notre [page de pricing](${SiteConfig.prodUrl}/pricing) et effectue un paiement en crypto (USDC ou USDT)`,
        inline: false,
      },
    )
    .setFooter({
      text: `${SiteConfig.title}`,
    })
    .setTimestamp();

  return sendDM(discordUserId, embed);
}

/**
 * Notifier un utilisateur en DM que son abonnement a expiré et qu'il a été downgraded vers FREE
 *
 * @param discordUserId - Discord User ID
 * @param oldPlan - Ancien plan ("pro", "ultra")
 * @returns true si le message a été envoyé avec succès
 */
export async function notifyDowngradeToFree(
  discordUserId: string,
  oldPlan: string,
): Promise<boolean> {
  const planDisplayName = oldPlan === "pro" ? "Pro" : "Ultra";

  const embed = new EmbedBuilder()
    .setColor(0x6b7280) // Gray
    .setTitle(`ℹ️ Ton abonnement ${planDisplayName} a expiré`)
    .setDescription(
      `Ton abonnement **${planDisplayName}** a expiré. Ton compte a été automatiquement downgraded vers le plan **Free**.\n\n` +
        `Tu peux continuer à utiliser ${SiteConfig.title} avec les fonctionnalités suivantes :`,
    )
    .addFields(
      {
        name: "🆓 Plan Free",
        value:
          `• 5 signaux par jour\n` +
          `• 1 trader à suivre\n` +
          `• Screener avec refresh toutes les 5 minutes`,
        inline: false,
      },
      {
        name: "🔄 Reprendre un abonnement",
        value:
          `Tu peux upgrader à tout moment vers un plan payant pour récupérer l'accès aux fonctionnalités premium :\n\n` +
          `💎 **Plan Pro - 49$/mois** : 50 signaux/jour, 5 traders\n` +
          `🚀 **Plan Ultra - 99$/mois** : Signaux illimités, traders illimités\n\n` +
          `[Voir les plans](${SiteConfig.prodUrl}/pricing)`,
        inline: false,
      },
    )
    .setFooter({
      text: `${SiteConfig.title} - Merci d'avoir utilisé ${planDisplayName} ! 🙏`,
    })
    .setTimestamp();

  return sendDM(discordUserId, embed);
}
