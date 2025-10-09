import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";

/**
 * Commande /help - Affiche la liste des commandes disponibles
 */
export async function handleHelpCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("🤖 MyCryptoPilot Bot - Commandes")
    .setDescription(
      "Voici la liste des commandes disponibles pour gérer ton abonnement et accéder aux signaux de trading.",
    )
    .addFields(
      {
        name: "📊 /status",
        value:
          "Affiche le statut de ton abonnement (plan actuel, date d'expiration, signaux restants)",
        inline: false,
      },
      {
        name: "📈 /signals",
        value:
          "Affiche les 5 derniers signaux de trading des traders que tu suis",
        inline: false,
      },
      {
        name: "👤 /follow @trader",
        value:
          "Suis un trader pour recevoir ses signaux de trading dans #signals",
        inline: false,
      },
      {
        name: "⬆️ /upgrade",
        value:
          "Obtiens le lien pour upgrader ton abonnement (Pro ou Ultra) et débloquer plus de signaux",
        inline: false,
      },
      {
        name: "❓ /help",
        value: "Affiche cette liste de commandes",
        inline: false,
      },
    )
    .setFooter({
      text: `${SiteConfig.title} - Trading Signals Risk-First`,
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
