import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";
import { prisma } from "@/lib/prisma";

export async function handleUnfollowCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordUserId = interaction.user.id;
  const targetUser = interaction.options.getUser("trader", true);

  const user = await prisma.user.findFirst({
    where: { discordId: discordUserId },
    select: {
      id: true,
    },
  });

  if (!user) {
    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle("❌ Compte non trouvé")
      .setDescription(
        `Ton compte Discord n'est pas lié à ${SiteConfig.title}. Connecte-toi sur ${SiteConfig.prodUrl}/auth/signin puis synchronise ton Discord dans Compte → Discord.`,
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const trader = await prisma.user.findFirst({
    where: { discordId: targetUser.id },
    include: {
      traderProfile: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  if (!trader?.traderProfile) {
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle("ℹ️ Pas un trader")
      .setDescription(
        `${targetUser.username} n'est pas identifié comme trader vérifié sur ${SiteConfig.title}.`,
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const follow = await prisma.follow.findFirst({
    where: {
      userId: user.id,
      traderId: trader.id,
      status: "ACTIVE",
    },
  });

  if (!follow) {
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle("ℹ️ Déjà désabonné")
      .setDescription(
        `Tu ne suis pas **${trader.traderProfile.displayName}** pour le moment.`,
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  await prisma.follow.update({
    where: { id: follow.id },
    data: { status: "CANCELLED" },
  });

  const embed = new EmbedBuilder()
    .setColor(0x10b981)
    .setTitle("✅ Trader retiré")
    .setDescription(
      `Tu ne recevras plus les signaux de **${trader.traderProfile.displayName}**.`,
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
