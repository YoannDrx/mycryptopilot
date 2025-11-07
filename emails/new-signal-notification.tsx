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

type NewSignalNotificationEmailProps = {
  userName: string;
  traderName: string;
  signal: {
    asset: string;
    bias: "LONG" | "SHORT";
    instrumentType: "SPOT" | "PERP";
    entry: string;
    targets: string[];
    stopLoss: string;
    leverage?: number;
    timeframe: string;
    riskLevel: number;
    confidence: number;
    rationales: string[];
  };
  signalUrl: string;
};

export function NewSignalNotificationEmail({
  userName,
  traderName,
  signal,
  signalUrl,
}: NewSignalNotificationEmailProps) {
  const biasEmoji = signal.bias === "LONG" ? "🟢" : "🔴";
  const biasColor = signal.bias === "LONG" ? "#10b981" : "#ef4444";
  const riskEmojis = "⭐".repeat(signal.riskLevel);

  return (
    <EmailLayout>
      <Preview>
        {biasEmoji} New {signal.bias} signal on {signal.asset} by {traderName} -
        Nouveau signal {signal.bias} sur {signal.asset} par {traderName}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        📊 New Trading Signal
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        <strong>{traderName}</strong> just published a new trading signal you're
        following:
      </Text>

      {/* Signal Card */}
      <Section className="my-6 rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: biasColor }}>
              {biasEmoji} {signal.asset}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {signal.instrumentType}
            </span>
          </div>
          <span className="text-xl font-bold" style={{ color: biasColor }}>
            {signal.bias}
          </span>
        </div>

        {/* Prices */}
        <Section className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <Text className="mb-1 text-xs font-semibold text-gray-500 uppercase">
              Entry
            </Text>
            <Text className="text-lg font-bold text-gray-900">
              ${signal.entry}
            </Text>
          </div>
          <div>
            <Text className="mb-1 text-xs font-semibold text-gray-500 uppercase">
              Stop Loss
            </Text>
            <Text className="text-lg font-bold text-red-600">
              ${signal.stopLoss}
            </Text>
          </div>
        </Section>

        {/* Targets */}
        <Section className="mb-4">
          <Text className="mb-2 text-xs font-semibold text-gray-500 uppercase">
            Take Profit Targets
          </Text>
          <div className="flex gap-2">
            {signal.targets.map((target, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-lg bg-green-50 p-2 text-center"
              >
                <Text className="text-xs text-gray-600">TP{idx + 1}</Text>
                <Text className="text-base font-bold text-green-700">
                  ${target}
                </Text>
              </div>
            ))}
          </div>
        </Section>

        {/* Details */}
        <Section className="mb-4 flex gap-4 border-t border-gray-200 pt-4">
          {signal.leverage && (
            <div className="flex-1">
              <Text className="text-xs text-gray-500">Leverage</Text>
              <Text className="text-base font-semibold text-gray-900">
                {signal.leverage}x
              </Text>
            </div>
          )}
          <div className="flex-1">
            <Text className="text-xs text-gray-500">Timeframe</Text>
            <Text className="text-base font-semibold text-gray-900">
              {signal.timeframe}
            </Text>
          </div>
          <div className="flex-1">
            <Text className="text-xs text-gray-500">Risk</Text>
            <Text className="text-base font-semibold text-gray-900">
              {riskEmojis}
            </Text>
          </div>
          <div className="flex-1">
            <Text className="text-xs text-gray-500">Confidence</Text>
            <Text className="text-base font-semibold text-gray-900">
              {signal.confidence}%
            </Text>
          </div>
        </Section>

        {/* Rationales */}
        {signal.rationales.length > 0 && (
          <Section className="rounded-lg bg-blue-50 p-4">
            <Text className="mb-2 text-xs font-semibold text-blue-900 uppercase">
              📝 Rationales
            </Text>
            <ul className="list-disc space-y-1 pl-5">
              {signal.rationales.slice(0, 3).map((rationale, idx) => (
                <li key={idx} className="text-sm text-blue-900">
                  {rationale}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Section>

      {/* CTA */}
      <Section className="my-6 text-center">
        <Button
          href={signalUrl}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          📊 View Full Signal
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 <strong>Reminder:</strong> This signal is for informational purposes
        only. Always do your own research and only trade what you can afford to
        lose.
      </Text>

      <Text className="text-sm text-gray-500">
        You'll receive a notification for every new signal from traders you
        follow. You can manage your preferences in{" "}
        <a
          href={`${SiteConfig.prodUrl}/account/email`}
          className="text-indigo-600 no-underline"
        >
          email settings
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
        📊 Nouveau Signal de Trading
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        <strong>{traderName}</strong> vient de publier un nouveau signal de
        trading que tu suis :
      </Text>

      {/* Signal Card */}
      <Section className="my-6 rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: biasColor }}>
              {biasEmoji} {signal.asset}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {signal.instrumentType}
            </span>
          </div>
          <span className="text-xl font-bold" style={{ color: biasColor }}>
            {signal.bias}
          </span>
        </div>

        {/* Prices */}
        <Section className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <Text className="mb-1 text-xs font-semibold text-gray-500 uppercase">
              Entry
            </Text>
            <Text className="text-lg font-bold text-gray-900">
              ${signal.entry}
            </Text>
          </div>
          <div>
            <Text className="mb-1 text-xs font-semibold text-gray-500 uppercase">
              Stop Loss
            </Text>
            <Text className="text-lg font-bold text-red-600">
              ${signal.stopLoss}
            </Text>
          </div>
        </Section>

        {/* Targets */}
        <Section className="mb-4">
          <Text className="mb-2 text-xs font-semibold text-gray-500 uppercase">
            Take Profit Targets
          </Text>
          <div className="flex gap-2">
            {signal.targets.map((target, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-lg bg-green-50 p-2 text-center"
              >
                <Text className="text-xs text-gray-600">TP{idx + 1}</Text>
                <Text className="text-base font-bold text-green-700">
                  ${target}
                </Text>
              </div>
            ))}
          </div>
        </Section>

        {/* Details */}
        <Section className="mb-4 flex gap-4 border-t border-gray-200 pt-4">
          {signal.leverage && (
            <div className="flex-1">
              <Text className="text-xs text-gray-500">Leverage</Text>
              <Text className="text-base font-semibold text-gray-900">
                {signal.leverage}x
              </Text>
            </div>
          )}
          <div className="flex-1">
            <Text className="text-xs text-gray-500">Timeframe</Text>
            <Text className="text-base font-semibold text-gray-900">
              {signal.timeframe}
            </Text>
          </div>
          <div className="flex-1">
            <Text className="text-xs text-gray-500">Risk</Text>
            <Text className="text-base font-semibold text-gray-900">
              {riskEmojis}
            </Text>
          </div>
          <div className="flex-1">
            <Text className="text-xs text-gray-500">Confidence</Text>
            <Text className="text-base font-semibold text-gray-900">
              {signal.confidence}%
            </Text>
          </div>
        </Section>

        {/* Rationales */}
        {signal.rationales.length > 0 && (
          <Section className="rounded-lg bg-blue-50 p-4">
            <Text className="mb-2 text-xs font-semibold text-blue-900 uppercase">
              📝 Rationales
            </Text>
            <ul className="list-disc space-y-1 pl-5">
              {signal.rationales.slice(0, 3).map((rationale, idx) => (
                <li key={idx} className="text-sm text-blue-900">
                  {rationale}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Section>

      {/* CTA */}
      <Section className="my-6 text-center">
        <Button
          href={signalUrl}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          📊 Voir le signal complet
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 <strong>Rappel :</strong> Ce signal est à titre informatif. Fais
        toujours tes propres recherches et ne trade que ce que tu es prêt à
        perdre.
      </Text>

      <Text className="text-sm text-gray-500">
        Tu recevras une notification pour chaque nouveau signal des traders que
        tu suis. Tu peux gérer tes préférences dans{" "}
        <a
          href={`${SiteConfig.prodUrl}/account/email`}
          className="text-indigo-600 no-underline"
        >
          les paramètres email
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

// Default props for preview
NewSignalNotificationEmail.PreviewProps = {
  userName: "Thomas D.",
  traderName: "CryptoMaster",
  signal: {
    asset: "BTC",
    bias: "LONG" as const,
    instrumentType: "PERP" as const,
    entry: "45000",
    targets: ["46000", "47000", "48000"],
    stopLoss: "44000",
    leverage: 5,
    timeframe: "4H",
    riskLevel: 3,
    confidence: 75,
    rationales: [
      "Strong support at 44k level",
      "Bullish divergence on RSI",
      "Breakout above key resistance",
    ],
  },
  signalUrl: "https://mycryptopilot.app/signals/123",
} as NewSignalNotificationEmailProps;

// Default export for React Email dev server
export default NewSignalNotificationEmail;
