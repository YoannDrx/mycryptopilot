import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";
import { prisma } from "@/lib/prisma";
import {
  getPlanByName,
  type MyCryptoPilotPlanName,
} from "@/lib/crypto/mycryptopilot-plans";

/**
 * Commande /status - Affiche le statut de l'abonnement utilisateur
 */
export async function handleStatusCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordUserId = interaction.user.id;

  // Rechercher l'utilisateur dans la DB via son Discord ID
  const user = await prisma.user.findFirst({
    where: {
      discordId: discordUserId,
    },
    include: {
      follows: true, // Include follows to count them
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

  // Récupérer le plan de l'utilisateur
  const planName = (user.planName ?? "free") as MyCryptoPilotPlanName;
  const plan = getPlanByName(planName);

  // Calculer les signaux restants aujourd'hui
  const signalsUsedToday = user.dailySignalsUsed;
  const signalsRemaining =
    plan.limits.signalsPerDay === 999
      ? "∞ (illimité)"
      : `${Math.max(0, plan.limits.signalsPerDay - signalsUsedToday)}/${plan.limits.signalsPerDay}`;

  // Date d'expiration
  const expiresAt = user.planExpiresAt;
  const expirationText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Aucune expiration";

  // Couleur selon le plan
  const planColors: Record<MyCryptoPilotPlanName, number> = {
    free: 0x6b7280, // Gray
    pro: parseInt(SiteConfig.brand.primary.replace("#", ""), 16), // Amber
    ultra: 0x8b5cf6, // Purple
  };

  const embed = new EmbedBuilder()
    .setColor(planColors[planName])
    .setTitle(`📊 Statut de ton abonnement`)
    .setDescription(`Voici les détails de ton compte **${SiteConfig.title}**`)
    .addFields(
      {
        name: "💎 Plan actuel",
        value: `**${planName.toUpperCase()}** (${plan.priceUSD}$/mois)`,
        inline: true,
      },
      {
        name: "📅 Expiration",
        value: expirationText,
        inline: true,
      },
      {
        name: "📊 Signaux restants aujourd'hui",
        value: signalsRemaining,
        inline: false,
      },
      {
        name: "👥 Traders suivis",
        value: `${user.follows.length}/${plan.limits.tradersFollow === 999 ? "∞" : plan.limits.tradersFollow}`,
        inline: true,
      },
      {
        name: "⏱️ Délai screener",
        value: `${plan.limits.screenerRefreshSec}s`,
        inline: true,
      },
    )
    .setFooter({ text: `${SiteConfig.title} - ${user.email}` })
    .setTimestamp();

  // Ajouter message d'upgrade si plan free
  if (planName === "free") {
    embed.addFields({
      name: "⬆️ Envie de plus ?",
      value: `Utilise \`/upgrade\` pour passer Pro ou Ultra et débloquer plus de signaux !`,
      inline: false,
    });
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
