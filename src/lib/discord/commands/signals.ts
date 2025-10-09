import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";
import { prisma } from "@/lib/prisma";

/**
 * Commande /signals - Affiche les 5 derniers signaux de trading
 */
export async function handleSignalsCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordUserId = interaction.user.id;

  // Rechercher l'utilisateur dans la DB via son Discord ID
  const user = await prisma.user.findFirst({
    where: {
      discordId: discordUserId,
    },
    select: {
      id: true,
      planName: true,
      follows: {
        select: {
          traderId: true,
        },
      },
    },
  });

  if (!user) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444) // Red
      .setTitle("❌ Compte non trouvé")
      .setDescription(
        `Ton compte Discord n'est pas lié à ${SiteConfig.title}.\n\n` +
          `🔗 **Connecte-toi d'abord sur le site:**\n${SiteConfig.prodUrl}/signin`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Récupérer les IDs des traders suivis
  const followedTraderIds = user.follows.map((f) => f.traderId);

  // Si l'utilisateur ne suit aucun trader
  if (followedTraderIds.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b) // Amber
      .setTitle("📊 Aucun signal disponible")
      .setDescription(
        `Tu ne suis aucun trader pour le moment.\n\n` +
          `🔍 **Découvre des traders vérifiés:**\n${SiteConfig.prodUrl}/traders`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Récupérer les 5 derniers signaux des traders suivis
  const signals = await prisma.signal.findMany({
    where: {
      traderId: {
        in: followedTraderIds,
      },
      expiresAt: {
        gte: new Date(), // Seulement les signaux non expirés
      },
    },
    include: {
      trader: {
        include: {
          traderProfile: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Si aucun signal trouvé
  if (signals.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b) // Amber
      .setTitle("📊 Aucun signal récent")
      .setDescription(
        `Les traders que tu suis n'ont publié aucun signal récemment.\n\n` +
          `💡 **Reviens plus tard ou suis plus de traders !**`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Formater les signaux
  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("📊 Derniers signaux de trading")
    .setDescription(
      `Voici les **${signals.length} derniers signaux** publiés par les traders que tu suis.`,
    )
    .setFooter({ text: `${SiteConfig.title} - ${signals.length} signaux` })
    .setTimestamp();

  // Ajouter chaque signal comme un field
  for (const signal of signals) {
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

    const bias = payload.bias ?? "UNKNOWN";
    const entry = payload.entry ?? 0;
    const tp1 = payload.tps?.[0] ?? 0;
    const invalidation = payload.invalidation ?? 0;
    const confidence = payload.confidence ?? 0;
    const risk = payload.risk ?? 0;

    // Calculer le temps écoulé depuis la publication
    const now = new Date();
    const createdAt = new Date(signal.createdAt);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const timeAgo =
      diffHours < 1
        ? "il y a moins d'1h"
        : diffHours === 1
          ? "il y a 1h"
          : `il y a ${diffHours}h`;

    embed.addFields({
      name: `${bias === "LONG" ? "🟢" : "🔴"} ${signal.symbol} - ${traderName}`,
      value:
        `**${bias}** @ ${entry}\n` +
        `TP1: ${tp1} | SL: ${invalidation}\n` +
        `Confiance: ${confidence}% | Risque: ${risk}/5\n` +
        `_${timeAgo}_`,
      inline: false,
    });
  }

  // Ajouter un lien vers le site
  embed.addFields({
    name: "🔗 Voir plus de détails",
    value: `Consulte tous les signaux sur ${SiteConfig.prodUrl}/signals`,
    inline: false,
  });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
