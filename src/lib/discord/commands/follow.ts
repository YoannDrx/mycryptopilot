import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/crypto/mycryptopilot-plans";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Commande /follow - Suivre un trader directement depuis Discord
 *
 * Usage: /follow @trader
 */
export async function handleFollowCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordUserId = interaction.user.id;
  const targetUser = interaction.options.getUser("trader", true);
  const targetDiscordId = targetUser.id;

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

  // Rechercher le trader cible via son Discord ID
  const targetTrader = await prisma.user.findFirst({
    where: {
      discordId: targetDiscordId,
    },
    include: {
      traderProfile: {
        select: {
          id: true,
          displayName: true,
          verified: true,
        },
      },
    },
  });

  if (!targetTrader) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444) // Red
      .setTitle("❌ Trader non trouvé")
      .setDescription(
        `${targetUser.username} n'a pas de compte lié à ${SiteConfig.title} ou n'est pas un trader vérifié.`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  if (!targetTrader.traderProfile) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444) // Red
      .setTitle("❌ Pas un trader")
      .setDescription(
        `${targetUser.username} n'est pas un trader vérifié sur ${SiteConfig.title}.`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Vérifier si l'utilisateur suit déjà ce trader
  const alreadyFollowing = user.follows.some(
    (f) => f.traderId === targetTrader.id,
  );

  if (alreadyFollowing) {
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b) // Amber
      .setTitle("ℹ️ Déjà suivi")
      .setDescription(
        `Tu suis déjà **${targetTrader.traderProfile.displayName}**.\n\n` +
          `🔗 **Voir son profil:**\n${SiteConfig.prodUrl}/traders/${targetTrader.id}`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Vérifier les limites du plan
  const planName = (user.planName ?? "free") as MyCryptoPilotPlanName;
  const limits = getPlanLimits(planName);
  const currentFollowCount = user.follows.length;

  if (limits.tradersFollow !== 999 && currentFollowCount >= limits.tradersFollow) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444) // Red
      .setTitle("❌ Limite atteinte")
      .setDescription(
        `Tu as atteint la limite de **${limits.tradersFollow} trader(s)** pour ton plan **${planName.toUpperCase()}**.\n\n` +
          `⬆️ **Upgrade ton plan:**\n${SiteConfig.prodUrl}/pricing`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    return;
  }

  // Créer le follow
  try {
    await prisma.follow.create({
      data: {
        userId: user.id,
        traderId: targetTrader.id,
        status: "ACTIVE",
      },
    });

    const embed = new EmbedBuilder()
      .setColor(0x10b981) // Green
      .setTitle("✅ Trader suivi !")
      .setDescription(
        `Tu suis maintenant **${targetTrader.traderProfile.displayName}** ${targetTrader.traderProfile.verified ? "✓" : ""}.\n\n` +
          `Tu recevras ses signaux de trading dans le channel **#signals**.\n\n` +
          `🔗 **Voir son profil:**\n${SiteConfig.prodUrl}/traders/${targetTrader.id}`,
      )
      .addFields({
        name: "📊 Traders suivis",
        value: `${currentFollowCount + 1}/${limits.tradersFollow === 999 ? "∞" : limits.tradersFollow}`,
        inline: true,
      })
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444) // Red
      .setTitle("❌ Erreur")
      .setDescription(
        `Une erreur est survenue lors du suivi de ce trader.\n\n` +
          `Contacte le support: ${SiteConfig.team.twitter}`,
      )
      .setFooter({ text: SiteConfig.title })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
}
