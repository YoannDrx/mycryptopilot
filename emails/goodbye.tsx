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

type GoodbyeEmailProps = {
  userName: string;
};

export function GoodbyeEmail({ userName }: GoodbyeEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Your account has been deleted - Ton compte a été supprimé -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        Goodbye {userName} 👋
      </Heading>

      <Text className="text-base text-gray-700">
        Your account has been permanently deleted from {SiteConfig.title}.
      </Text>

      <Section className="my-6">
        <Text className="text-base text-gray-700">
          <strong>What has been deleted:</strong>
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>All your personal data</li>
          <li>Your trading signals and history</li>
          <li>Your subscriptions and payment information</li>
          <li>Your trader profile (if you had one)</li>
          <li>Your access to premium Discord channels</li>
        </ul>
      </Section>

      <Text className="text-base text-gray-700">
        If you had linked a Discord account, your access to premium channels has
        been revoked. You can still stay in the public Discord server if you
        wish.
      </Text>

      <Text className="text-base text-gray-700">
        We're sad to see you go, but we hope you had a good experience with us.
        You're always welcome to come back! 🚀
      </Text>

      <Section className="my-6 text-center">
        <Button
          href={`https://${SiteConfig.domain}`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Return to {SiteConfig.title}
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Questions? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          {SiteConfig.email.contact}
        </a>
      </Text>

      <Text className="text-xs text-gray-400">
        This deletion is permanent and cannot be undone. If this was a mistake,
        you can always create a new account.
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        Au revoir {userName} 👋
      </Heading>

      <Text className="text-base text-gray-700">
        Ton compte a été définitivement supprimé de {SiteConfig.title}.
      </Text>

      <Section className="my-6">
        <Text className="text-base text-gray-700">
          <strong>Ce qui a été supprimé :</strong>
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>Toutes tes données personnelles</li>
          <li>Tes signaux de trading et historiques</li>
          <li>Tes abonnements et informations de paiement</li>
          <li>Ton profil trader (si tu en avais un)</li>
          <li>Ton accès aux channels Discord premium</li>
        </ul>
      </Section>

      <Text className="text-base text-gray-700">
        Si tu avais lié un compte Discord, ton accès aux channels premium a été
        révoqué. Tu peux toujours rester dans le serveur Discord public si tu le
        souhaites.
      </Text>

      <Text className="text-base text-gray-700">
        Nous sommes tristes de te voir partir, mais nous espérons que tu as eu
        une bonne expérience avec nous. Tu es toujours le bienvenu pour revenir
        ! 🚀
      </Text>

      <Section className="my-6 text-center">
        <Button
          href={`https://${SiteConfig.domain}`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Revenir sur {SiteConfig.title}
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Questions ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          {SiteConfig.email.contact}
        </a>
      </Text>

      <Text className="text-xs text-gray-400">
        Cette suppression est définitive et ne peut pas être annulée. Si c'était
        une erreur, tu peux toujours recréer un compte.
      </Text>
    </EmailLayout>
  );
}

export default GoodbyeEmail;
