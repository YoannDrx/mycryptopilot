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

type TraderInvitationEmailProps = {
  traderName: string;
  invitationUrl: string;
};

export function TraderInvitationEmail({
  traderName,
  invitationUrl,
}: TraderInvitationEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        {traderName} invited you to follow them - {traderName} t'invite à le
        suivre - {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        You've been invited to follow {traderName}!
      </Heading>

      <Text className="text-base text-gray-700">
        <strong>{traderName}</strong> wants to share their trading signals with
        you on <strong>{SiteConfig.title}</strong>.
      </Text>

      <Section className="my-6">
        <Text className="text-base text-gray-700">
          By following {traderName}, you'll get:
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>Real-time Discord notifications for new signals</li>
          <li>Access to their trading track record</li>
          <li>Professional trading insights and analysis</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={invitationUrl}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Follow {traderName}
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        This invitation will expire in 7 days. If you didn't expect this
        invitation, you can safely ignore this email.
      </Text>

      <Text className="text-sm text-gray-500">
        Questions? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          {SiteConfig.email.contact}
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
        Tu as été invité à suivre {traderName} !
      </Heading>

      <Text className="text-base text-gray-700">
        <strong>{traderName}</strong> souhaite partager ses signaux de trading
        avec toi sur <strong>{SiteConfig.title}</strong>.
      </Text>

      <Section className="my-6">
        <Text className="text-base text-gray-700">
          En suivant {traderName}, tu recevras :
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            Des notifications Discord en temps réel pour les nouveaux signaux
          </li>
          <li>L'accès à son historique de trading</li>
          <li>Des analyses et insights de trading professionnels</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={invitationUrl}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Suivre {traderName}
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Cette invitation expirera dans 7 jours. Si tu ne t'attendais pas à cette
        invitation, tu peux ignorer cet email en toute sécurité.
      </Text>

      <Text className="text-sm text-gray-500">
        Questions ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          {SiteConfig.email.contact}
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default TraderInvitationEmail;
