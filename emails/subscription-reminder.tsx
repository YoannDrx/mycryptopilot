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

type SubscriptionReminderEmailProps = {
  userName: string;
  planName: string;
  expiresAt: Date;
  daysRemaining: number;
};

export function SubscriptionReminderEmail({
  userName,
  planName,
  expiresAt,
  daysRemaining,
}: SubscriptionReminderEmailProps) {
  const urgencyLevel =
    daysRemaining <= 1 ? "high" : daysRemaining <= 3 ? "medium" : "low";

  const urgencyEmoji =
    urgencyLevel === "high" ? "🚨" : urgencyLevel === "medium" ? "⚠️" : "ℹ️";

  const urgencyMessageEN =
    urgencyLevel === "high"
      ? "Your subscription expires tomorrow!"
      : urgencyLevel === "medium"
        ? "Your subscription expires soon."
        : "Reminder: your subscription is expiring.";

  const urgencyMessageFR =
    urgencyLevel === "high"
      ? "Ton abonnement expire demain !"
      : urgencyLevel === "medium"
        ? "Ton abonnement expire bientôt."
        : "Rappel : ton abonnement arrive à échéance.";

  return (
    <EmailLayout>
      <Preview>
        {urgencyEmoji} Subscription expiring - Rappel d'expiration -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        {urgencyEmoji} {urgencyMessageEN}
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Your <strong>{planName.toUpperCase()}</strong> subscription expires in{" "}
        <strong>
          {daysRemaining} day{daysRemaining > 1 ? "s" : ""}
        </strong>{" "}
        (on {expiresAt.toLocaleDateString("en-US")}).
      </Text>

      <Section className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-amber-900">
          ⏰ Expiration Date
        </Text>
        <Text className="text-base font-bold text-amber-900">
          {expiresAt.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Section>

      <Text className="text-base text-gray-700">
        After expiration, your account will automatically downgrade to the{" "}
        <strong>FREE Plan</strong> and you will lose access to the following
        features:
      </Text>

      <Section className="my-6">
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>❌ Full real-time signals (limited to 5 teasers/day)</li>
          <li>❌ Unlimited traders (limited to 1 trader)</li>
          <li>❌ Risk console and trading journal</li>
          <li>❌ Access to traders' private Discord channels</li>
          <li>❌ Real-time screeners (downgraded to 5min refresh)</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/pricing`}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🔄 Renew my subscription
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 <strong>Crypto payment only</strong>: USDC on Base or USDT on Tron.
        Renewal is instant after transaction confirmation.
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        {urgencyEmoji} {urgencyMessageFR}
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Ton abonnement <strong>{planName.toUpperCase()}</strong> expire dans{" "}
        <strong>
          {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
        </strong>{" "}
        (le {expiresAt.toLocaleDateString("fr-FR")}).
      </Text>

      <Section className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-amber-900">
          ⏰ Date d'expiration
        </Text>
        <Text className="text-base font-bold text-amber-900">
          {expiresAt.toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Section>

      <Text className="text-base text-gray-700">
        Après expiration, ton compte sera automatiquement rétrogradé vers le{" "}
        <strong>Plan FREE</strong> et tu perdras l'accès aux fonctionnalités
        suivantes :
      </Text>

      <Section className="my-6">
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>❌ Signaux complets en temps réel (limité à 5 teasers/jour)</li>
          <li>❌ Traders illimités (limité à 1 trader)</li>
          <li>❌ Console de risque et journal de trading</li>
          <li>❌ Accès aux channels Discord privés des traders</li>
          <li>❌ Screeners temps réel (passage à refresh 5min)</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/pricing`}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🔄 Renouveler mon abonnement
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 <strong>Paiement en crypto uniquement</strong> : USDC sur Base ou
        USDT sur Tron. Le renouvellement est instantané après confirmation de
        transaction.
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default SubscriptionReminderEmail;
