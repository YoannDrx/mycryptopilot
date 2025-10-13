import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
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
      <Preview>Ton compte a été supprimé - {SiteConfig.title}</Preview>

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
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Revenir sur {SiteConfig.title}
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Questions ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
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
