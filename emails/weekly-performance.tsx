import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Hr,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type WeeklyPerformanceEmailProps = {
  userName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  stats: {
    totalSignals: number;
    signalsFollowed: number;
    winRate: number;
    totalPnlPercent: number;
    bestTrade: {
      asset: string;
      pnlPercent: number;
    } | null;
    worstTrade: {
      asset: string;
      pnlPercent: number;
    } | null;
  };
  topTraders: {
    name: string;
    winRate: number;
    signalsCount: number;
  }[];
};

export function WeeklyPerformanceEmail({
  userName = "User",
  weekStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  weekEndDate = new Date(),
  stats = {
    totalSignals: 12,
    signalsFollowed: 8,
    winRate: 62.5,
    totalPnlPercent: 4.25,
    bestTrade: { asset: "BTC", pnlPercent: 8.5 },
    worstTrade: { asset: "ETH", pnlPercent: -2.1 },
  },
  topTraders = [
    { name: "CryptoMaster", winRate: 75, signalsCount: 5 },
    { name: "TradingPro", winRate: 68, signalsCount: 4 },
  ],
}: WeeklyPerformanceEmailProps) {
  const isProfitable = stats.totalPnlPercent >= 0;
  const performanceEmoji = isProfitable ? "📈" : "📉";
  const performanceColor = isProfitable ? "#10b981" : "#ef4444";

  return (
    <EmailLayout>
      <Preview>
        Weekly Report: {isProfitable ? "+" : ""}
        {stats.totalPnlPercent.toFixed(2)}% - Rapport hebdo - {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        {performanceEmoji} Weekly Trading Report
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Here's your trading performance summary for{" "}
        <strong>
          {weekStartDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {weekEndDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </strong>
        .
      </Text>

      {/* Main Performance Card */}
      <Section
        className="my-6 rounded-lg border-2 p-6"
        style={{
          borderColor: performanceColor,
          backgroundColor: isProfitable ? "#ecfdf5" : "#fef2f2",
        }}
      >
        <Text
          className="mb-2 text-center text-sm font-semibold uppercase"
          style={{ color: performanceColor }}
        >
          Total P&L
        </Text>
        <Text
          className="text-center text-4xl font-bold"
          style={{ color: performanceColor }}
        >
          {isProfitable ? "+" : ""}
          {stats.totalPnlPercent.toFixed(2)}%
        </Text>
      </Section>

      {/* Stats Grid */}
      <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-gray-900">
          📊 This Week's Stats
        </Text>
        <table style={{ width: "100%" }}>
          <tr>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Signals received</Text>
              <Text className="text-lg font-bold text-gray-900">
                {stats.totalSignals}
              </Text>
            </td>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Signals followed</Text>
              <Text className="text-lg font-bold text-gray-900">
                {stats.signalsFollowed}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Win rate</Text>
              <Text className="text-lg font-bold text-emerald-600">
                {stats.winRate.toFixed(1)}%
              </Text>
            </td>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Trades closed</Text>
              <Text className="text-lg font-bold text-gray-900">
                {stats.signalsFollowed}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Best & Worst Trades */}
      {(stats.bestTrade ?? stats.worstTrade) && (
        <Section className="my-6">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            🏆 Notable Trades
          </Text>
          <table style={{ width: "100%" }}>
            {stats.bestTrade && (
              <tr>
                <td
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"
                  style={{ marginBottom: "8px" }}
                >
                  <Text className="text-xs text-emerald-600 uppercase">
                    Best Trade
                  </Text>
                  <Text className="text-base font-bold text-emerald-900">
                    {stats.bestTrade.asset}: +
                    {stats.bestTrade.pnlPercent.toFixed(2)}%
                  </Text>
                </td>
              </tr>
            )}
            {stats.worstTrade && (
              <tr>
                <td className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <Text className="text-xs text-red-600 uppercase">
                    Worst Trade
                  </Text>
                  <Text className="text-base font-bold text-red-900">
                    {stats.worstTrade.asset}:{" "}
                    {stats.worstTrade.pnlPercent.toFixed(2)}%
                  </Text>
                </td>
              </tr>
            )}
          </table>
        </Section>
      )}

      {/* Top Traders */}
      {topTraders.length > 0 && (
        <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <Text className="mb-4 text-lg font-semibold text-emerald-900">
            ⭐ Your Top Performers This Week
          </Text>
          <table style={{ width: "100%" }}>
            {topTraders.slice(0, 3).map((trader, idx) => (
              <tr key={idx}>
                <td style={{ padding: "4px 0" }}>
                  <Text className="text-base font-semibold text-emerald-900">
                    {idx + 1}. {trader.name}
                  </Text>
                </td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  <Text className="text-sm text-emerald-700">
                    {trader.winRate.toFixed(0)}% WR ({trader.signalsCount}{" "}
                    signals)
                  </Text>
                </td>
              </tr>
            ))}
          </table>
        </Section>
      )}

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          📊 View Full Analytics
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 Want to improve your results? Consider following more top-performing
        traders on the{" "}
        <a
          href={`${SiteConfig.prodUrl}/marketplace`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          marketplace
        </a>
        .
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        {performanceEmoji} Rapport de Trading Hebdomadaire
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Voici ton résumé de performance trading pour la semaine du{" "}
        <strong>
          {weekStartDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}{" "}
          au{" "}
          {weekEndDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </strong>
        .
      </Text>

      {/* Main Performance Card - French */}
      <Section
        className="my-6 rounded-lg border-2 p-6"
        style={{
          borderColor: performanceColor,
          backgroundColor: isProfitable ? "#ecfdf5" : "#fef2f2",
        }}
      >
        <Text
          className="mb-2 text-center text-sm font-semibold uppercase"
          style={{ color: performanceColor }}
        >
          P&L Total
        </Text>
        <Text
          className="text-center text-4xl font-bold"
          style={{ color: performanceColor }}
        >
          {isProfitable ? "+" : ""}
          {stats.totalPnlPercent.toFixed(2)}%
        </Text>
      </Section>

      {/* Stats Grid - French */}
      <Section className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-gray-900">
          📊 Stats de la semaine
        </Text>
        <table style={{ width: "100%" }}>
          <tr>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Signaux reçus</Text>
              <Text className="text-lg font-bold text-gray-900">
                {stats.totalSignals}
              </Text>
            </td>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Signaux suivis</Text>
              <Text className="text-lg font-bold text-gray-900">
                {stats.signalsFollowed}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Taux de réussite</Text>
              <Text className="text-lg font-bold text-emerald-600">
                {stats.winRate.toFixed(1)}%
              </Text>
            </td>
            <td style={{ padding: "8px 0" }}>
              <Text className="text-sm text-gray-600">Trades clôturés</Text>
              <Text className="text-lg font-bold text-gray-900">
                {stats.signalsFollowed}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Best & Worst Trades - French */}
      {(stats.bestTrade ?? stats.worstTrade) && (
        <Section className="my-6">
          <Text className="mb-3 text-base font-semibold text-gray-900">
            🏆 Trades remarquables
          </Text>
          <table style={{ width: "100%" }}>
            {stats.bestTrade && (
              <tr>
                <td
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"
                  style={{ marginBottom: "8px" }}
                >
                  <Text className="text-xs text-emerald-600 uppercase">
                    Meilleur trade
                  </Text>
                  <Text className="text-base font-bold text-emerald-900">
                    {stats.bestTrade.asset}: +
                    {stats.bestTrade.pnlPercent.toFixed(2)}%
                  </Text>
                </td>
              </tr>
            )}
            {stats.worstTrade && (
              <tr>
                <td className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <Text className="text-xs text-red-600 uppercase">
                    Pire trade
                  </Text>
                  <Text className="text-base font-bold text-red-900">
                    {stats.worstTrade.asset}:{" "}
                    {stats.worstTrade.pnlPercent.toFixed(2)}%
                  </Text>
                </td>
              </tr>
            )}
          </table>
        </Section>
      )}

      {/* Top Traders - French */}
      {topTraders.length > 0 && (
        <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <Text className="mb-4 text-lg font-semibold text-emerald-900">
            ⭐ Tes meilleurs performers cette semaine
          </Text>
          <table style={{ width: "100%" }}>
            {topTraders.slice(0, 3).map((trader, idx) => (
              <tr key={idx}>
                <td style={{ padding: "4px 0" }}>
                  <Text className="text-base font-semibold text-emerald-900">
                    {idx + 1}. {trader.name}
                  </Text>
                </td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  <Text className="text-sm text-emerald-700">
                    {trader.winRate.toFixed(0)}% WR ({trader.signalsCount}{" "}
                    signaux)
                  </Text>
                </td>
              </tr>
            ))}
          </table>
        </Section>
      )}

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          📊 Voir les Analytics Complets
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 Tu veux améliorer tes résultats ? Envisage de suivre plus de traders
        performants sur la{" "}
        <a
          href={`${SiteConfig.prodUrl}/marketplace`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          marketplace
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default WeeklyPerformanceEmail;
