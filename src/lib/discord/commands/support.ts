import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";

export async function handleSupportCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("🆘 Support MyCryptoPilot")
    .setDescription("Nous sommes là pour t'aider 24/7.")
    .addFields(
      {
        name: "📨 Email",
        value: SiteConfig.email.contact,
        inline: true,
      },
      {
        name: "🐦 Twitter",
        value: SiteConfig.team.twitter,
        inline: true,
      },
      {
        name: "📚 Documentation",
        value: `${SiteConfig.prodUrl}/docs`,
        inline: true,
      },
      {
        name: "💬 Discord",
        value:
          "Utilise ce serveur pour discuter avec l'équipe ou ouvrir un ticket.",
        inline: false,
      },
    )
    .setFooter({ text: "Réponse en moins de 24h sur les canaux officiels" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
