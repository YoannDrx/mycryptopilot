import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";
import { prisma } from "@/lib/prisma";

export async function handleLinkCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordId = interaction.user.id;

  const user = await prisma.user.findFirst({
    where: { discordId },
    select: {
      email: true,
      planName: true,
    },
  });

  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("🔗 Connecter ton compte MyCryptoPilot")
    .setTimestamp();

  if (user) {
    embed
      .setDescription(
        `Ton compte Discord est déjà lié à **${SiteConfig.title}** ✅\n\n` +
          `Email: **${user.email}**\nPlan actuel: **${(user.planName ?? "free").toUpperCase()}**`,
      )
      .addFields({
        name: "Besoin de changer ?",
        value: `Déconnecte ton Discord dans **Compte → Discord** sur ${SiteConfig.prodUrl}/account/discord puis reconnecte-toi.`,
      });
  } else {
    embed
      .setDescription(
        `Ton compte Discord n'est pas encore lié à **${SiteConfig.title}**.`,
      )
      .addFields(
        {
          name: "1️⃣ Connecte-toi sur MyCryptoPilot",
          value: `${SiteConfig.prodUrl}/auth/signin`,
        },
        {
          name: "2️⃣ Va dans Compte → Discord",
          value: "Clique sur **Connecter mon Discord** et autorise le bot",
        },
        {
          name: "3️⃣ Reviens ici",
          value: "Utilise à nouveau `/link` pour vérifier que tout est ok",
        },
      )
      .setFooter({
        text: "Astuce : garde cette fenêtre Discord ouverte pendant l'autorisation",
      });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
