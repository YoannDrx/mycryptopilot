import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { SiteConfig } from "@/site-config";

export async function handleRiskCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const capital = interaction.options.getNumber("capital", true);
  const entry = interaction.options.getNumber("entry", true);
  const stop = interaction.options.getNumber("stop", true);
  const takeProfit = interaction.options.getNumber("takeprofit", true);
  const riskPct = interaction.options.getNumber("riskpercent") ?? 2;

  if (capital <= 0 || entry <= 0 || takeProfit <= 0) {
    await interaction.reply({
      content: "❌ Capital, entry et take profit doivent être positifs.",
      ephemeral: true,
    });
    return;
  }

  const riskDistance = Math.abs(entry - stop);
  const rewardDistance = Math.abs(takeProfit - entry);

  if (riskDistance === 0) {
    await interaction.reply({
      content: "❌ La différence entre entry et stop ne peut pas être 0.",
      ephemeral: true,
    });
    return;
  }

  if (rewardDistance === 0) {
    await interaction.reply({
      content: "❌ La différence entre take profit et entry ne peut pas être 0.",
      ephemeral: true,
    });
    return;
  }

  const riskAmount = capital * (riskPct / 100);
  const units = riskAmount / riskDistance;
  const positionValue = units * entry;
  const rrRatio = rewardDistance / riskDistance;
  const priceRiskPct = (riskDistance / entry) * 100;
  const potentialGain = rewardDistance * units;

  const embed = new EmbedBuilder()
    .setColor(parseInt(SiteConfig.brand.primary.replace("#", ""), 16))
    .setTitle("🛡️ Calculateur 2% Rule")
    .setDescription(
      `Pour un capital de **$${capital.toFixed(2)}** et un risque de **${riskPct.toFixed(2)}%**, voici la taille de position suggérée.`,
    )
    .addFields(
      {
        name: "Risque par trade",
        value: `$${riskAmount.toFixed(2)} (${riskPct.toFixed(2)}%)`,
        inline: true,
      },
      {
        name: "Price risk",
        value: `${priceRiskPct.toFixed(2)}% (${riskDistance.toFixed(2)} points)`,
        inline: true,
      },
      {
        name: "Ratio Risk/Reward",
        value: `1:${rrRatio.toFixed(2)}`,
        inline: true,
      },
      {
        name: "Taille de position",
        value: `$${positionValue.toFixed(2)} ≈ ${units.toFixed(4)} unités`,
        inline: true,
      },
      {
        name: "Gain potentiel",
        value: `$${potentialGain.toFixed(2)}`,
        inline: true,
      },
      {
        name: "Rappel",
        value: "Ajuste ton levier pour respecter ce risque. RR > 2 recommandé.",
        inline: false,
      },
    )
    .setFooter({ text: "Console de risque MyCryptoPilot" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
