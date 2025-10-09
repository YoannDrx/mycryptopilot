import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";
import { getPlanByName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Commande /upgrade - Affiche les options d'upgrade
 */
export async function handleUpgradeCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const proPlan = getPlanByName("pro");
  const ultraPlan = getPlanByName("ultra");

  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("⬆️ Upgrade ton abonnement")
    .setDescription(
      `Débloque plus de signaux et fonctionnalités avancées avec nos plans **Pro** et **Ultra** !`,
    )
    .addFields(
      {
        name: `💎 Plan PRO - ${proPlan.priceUSD}$/mois`,
        value:
          `✅ ${proPlan.limits.signalsPerDay} signaux par jour\n` +
          `✅ Suis jusqu'à ${proPlan.limits.tradersFollow} traders vérifiés\n` +
          `✅ Screener temps réel (${proPlan.limits.screenerRefreshSec}s)\n` +
          `✅ Console de risque\n` +
          `✅ Journal de trading`,
        inline: false,
      },
      {
        name: `🚀 Plan ULTRA - ${ultraPlan.priceUSD}$/mois`,
        value:
          `✅ Signaux **illimités**\n` +
          `✅ Suis **tous les traders** vérifiés\n` +
          `✅ Screener ultra-rapide (${ultraPlan.limits.screenerRefreshSec}s)\n` +
          `✅ Alertes personnalisées\n` +
          `✅ Filtres avancés\n` +
          `✅ Accès prioritaire au support`,
        inline: false,
      },
      {
        name: "💳 Comment upgrader ?",
        value:
          `🔗 **Visite la page pricing:**\n` +
          `${SiteConfig.prodUrl}/pricing\n\n` +
          `Paiements acceptés: **USDC** (Base) et **USDT** (Tron)`,
        inline: false,
      },
    )
    .setFooter({
      text: `${SiteConfig.title} - Paiements crypto uniquement`,
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
