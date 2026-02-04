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

type WelcomeEmailProps = {
  userName: string;
};

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Welcome to {SiteConfig.title}! - Bienvenue sur {SiteConfig.title} !
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        Welcome to {SiteConfig.title}! 🚀
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Congratulations on joining {SiteConfig.title}! You're now part of a
        community of traders who take a <strong>risk-first approach</strong> to
        crypto trading.
      </Text>

      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          🎯 Getting Started
        </Text>
        <ul className="list-disc pl-5 text-base text-emerald-800">
          <li>
            <strong>Follow top traders</strong> - Browse the marketplace and
            follow traders whose strategies match your style
          </li>
          <li>
            <strong>Receive trading signals</strong> - Get real-time
            notifications when your traders publish signals
          </li>
          <li>
            <strong>Manage your risk</strong> - Use our risk console to track
            exposure and manage positions
          </li>
          <li>
            <strong>Connect Discord</strong> - Get instant alerts on Discord for
            new signals
          </li>
        </ul>
      </Section>

      <Section className="my-6">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          ⚡ Quick Links:
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <a
              href={`${SiteConfig.prodUrl}/marketplace`}
              className="text-indigo-600 no-underline"
            >
              Explore the Trader Marketplace
            </a>
          </li>
          <li>
            <a
              href={`${SiteConfig.prodUrl}/orgs/pricing`}
              className="text-indigo-600 no-underline"
            >
              View subscription plans
            </a>
          </li>
          <li>
            <a
              href={`${SiteConfig.prodUrl}/account/integrations`}
              className="text-indigo-600 no-underline"
            >
              Connect your Discord
            </a>
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🚀 Go to Dashboard
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 <strong>Free plan includes:</strong> 5 signal teasers/day, follow 1
        trader, public marketplace access. Upgrade to{" "}
        <a
          href={`${SiteConfig.prodUrl}/orgs/pricing`}
          className="text-indigo-600 no-underline"
        >
          Pro or Ultra
        </a>{" "}
        for full signals and unlimited traders.
      </Text>

      <Text className="text-sm text-gray-500">
        Questions? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        Bienvenue sur {SiteConfig.title} ! 🚀
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Félicitations pour ton inscription sur {SiteConfig.title} ! Tu fais
        maintenant partie d'une communauté de traders qui adopte une{" "}
        <strong>approche risk-first</strong> du trading crypto.
      </Text>

      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          🎯 Pour commencer
        </Text>
        <ul className="list-disc pl-5 text-base text-emerald-800">
          <li>
            <strong>Suis les meilleurs traders</strong> - Explore la marketplace
            et suis les traders dont les stratégies correspondent à ton style
          </li>
          <li>
            <strong>Reçois des signaux de trading</strong> - Reçois des
            notifications en temps réel quand tes traders publient des signaux
          </li>
          <li>
            <strong>Gère ton risque</strong> - Utilise notre console de risque
            pour suivre l'exposition et gérer tes positions
          </li>
          <li>
            <strong>Connecte Discord</strong> - Reçois des alertes instantanées
            sur Discord pour les nouveaux signaux
          </li>
        </ul>
      </Section>

      <Section className="my-6">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          ⚡ Liens rapides :
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <a
              href={`${SiteConfig.prodUrl}/marketplace`}
              className="text-indigo-600 no-underline"
            >
              Explorer la Marketplace des Traders
            </a>
          </li>
          <li>
            <a
              href={`${SiteConfig.prodUrl}/orgs/pricing`}
              className="text-indigo-600 no-underline"
            >
              Voir les plans d'abonnement
            </a>
          </li>
          <li>
            <a
              href={`${SiteConfig.prodUrl}/account/integrations`}
              className="text-indigo-600 no-underline"
            >
              Connecter ton Discord
            </a>
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🚀 Accéder au Dashboard
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        💡 <strong>Plan gratuit inclus :</strong> 5 teasers de signaux/jour, 1
        trader suivi, accès à la marketplace publique. Passe à{" "}
        <a
          href={`${SiteConfig.prodUrl}/orgs/pricing`}
          className="text-indigo-600 no-underline"
        >
          Pro ou Ultra
        </a>{" "}
        pour des signaux complets et des traders illimités.
      </Text>

      <Text className="text-sm text-gray-500">
        Questions ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default WelcomeEmail;
