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

type DiscordInviteEmailProps = {
  userName: string;
  inviteUrl: string;
};

export function DiscordInviteEmail({
  userName,
  inviteUrl,
}: DiscordInviteEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Join our Discord community - Rejoins notre communauté Discord -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎉 Welcome {userName}!
      </Heading>

      <Text className="text-base text-gray-700">
        Congratulations on signing up for <strong>{SiteConfig.title}</strong>!
      </Text>

      <Text className="text-base text-gray-700">
        To get the most out of your platform, join our Discord community where
        you'll receive:
      </Text>

      <Section className="my-6">
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>📬 Real-time trading signals</li>
          <li>💬 24/7 community support</li>
          <li>📊 Discussions with traders</li>
          <li>🎯 Personalized alerts</li>
          <li>🚀 Access to private channels of traders you follow</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={inviteUrl}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Join Discord
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        This invitation link is permanent and requires no additional
        registration. Simply click the button above to access our Discord
        server.
      </Text>

      <Text className="text-sm text-gray-500">
        Once on Discord, use the{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/status</code>{" "}
        command to link your account and access your favorite traders' channels.
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎉 Bienvenue {userName} !
      </Heading>

      <Text className="text-base text-gray-700">
        Félicitations pour ton inscription sur{" "}
        <strong>{SiteConfig.title}</strong> !
      </Text>

      <Text className="text-base text-gray-700">
        Pour profiter pleinement de ta plateforme, rejoins notre communauté
        Discord où tu recevras :
      </Text>

      <Section className="my-6">
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>📬 Signaux de trading en temps réel</li>
          <li>💬 Support communautaire 24/7</li>
          <li>📊 Discussions avec les traders</li>
          <li>🎯 Alertes personnalisées</li>
          <li>🚀 Accès aux channels privés des traders que tu suis</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={inviteUrl}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Rejoindre Discord
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Ce lien d'invitation est permanent et ne nécessite aucune inscription
        supplémentaire. Clique simplement sur le bouton ci-dessus pour accéder à
        notre serveur Discord.
      </Text>

      <Text className="text-sm text-gray-500">
        Une fois sur Discord, utilise la commande{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/status</code>{" "}
        pour lier ton compte et accéder aux channels de tes traders favoris.
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default DiscordInviteEmail;
