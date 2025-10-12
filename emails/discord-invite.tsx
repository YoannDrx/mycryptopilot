import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
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
        Rejoins notre communauté Discord - {SiteConfig.title}
      </Preview>

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
        supplémentaire. Clique simplement sur le bouton ci-dessus pour accéder
        à notre serveur Discord.
      </Text>

      <Text className="text-sm text-gray-500">
        Une fois sur Discord, utilise la commande{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/status</code>{" "}
        pour lier ton compte et accéder aux channels de tes traders favoris.
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
export default DiscordInviteEmail;
