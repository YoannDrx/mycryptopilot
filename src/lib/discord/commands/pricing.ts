import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import { MYCRYPTOPILOT_PLANS } from "@/lib/crypto/mycryptopilot-plans";

export async function handlePricingCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordId = interaction.user.id;

  const user = await prisma.user.findFirst({
    where: { discordId },
    select: {
      id: true,
      members: {
        include: {
          organization: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const plans = MYCRYPTOPILOT_PLANS.filter((plan) => plan.name !== "test");

  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("💳 Plans MyCryptoPilot")
    .setDescription(
      plans
        .map((plan) => {
          const features = plan.features
            .slice(0, 3)
            .map((feature) => `• ${feature.label}`)
            .join("\n");
          return `**${plan.name.toUpperCase()}** — $${plan.priceUSD}/mo\n${features}`;
        })
        .join("\n\n"),
    )
    .addFields(
      {
        name: "Paiements",
        value:
          "USDC (Base) ou USDT (Tron) • Pro-rata automatique • Plan test $1",
      },
      {
        name: "Console de risque",
        value: "Incluse sur tous les plans (limites plus élevées en Pro/Ultra)",
      },
    )
    .setTimestamp();

  let pricingUrl = `${SiteConfig.prodUrl}/pricing`;
  let note =
    "Crée un compte ou connecte-toi pour lancer le checkout crypto depuis ton espace.";

  if (user && user.members.length > 0) {
    const member = user.members[0];
    if (member.organization.slug) {
      pricingUrl = `${SiteConfig.prodUrl}/orgs/${member.organization.slug}/pricing`;
      note = `Tu peux payer directement depuis ton organisation **${member.organization.name}**.`;
    }
  }

  embed.addFields({
    name: "Accéder au pricing",
    value: `🔗 ${pricingUrl}\n${note}`,
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
