import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
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

  const urgencyMessage =
    urgencyLevel === "high"
      ? "Ton abonnement expire demain !"
      : urgencyLevel === "medium"
        ? "Ton abonnement expire bientôt."
        : "Rappel : ton abonnement arrive à échéance.";

  return (
    <EmailLayout>
      <Preview>
        {urgencyEmoji} Rappel d'expiration - {SiteConfig.title}
      </Preview>

      <Heading className="text-2xl font-bold text-gray-900">
        {urgencyEmoji} {urgencyMessage}
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

      <Text className="text-sm text-gray-500">
        Questions ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default SubscriptionReminderEmail;
