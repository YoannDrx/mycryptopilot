import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type ExchangeSyncFailureEmailProps = {
  userName: string;
  exchange: string;
  errorMessage: string;
  lastSuccessfulSync?: Date;
  connectionId: string;
  orgSlug: string | null;
};

export function ExchangeSyncFailureEmail({
  userName,
  exchange,
  errorMessage,
  lastSuccessfulSync,
  connectionId,
  orgSlug,
}: ExchangeSyncFailureEmailProps) {
  const isKeyError =
    errorMessage.includes("Invalid API") ||
    errorMessage.includes("401") ||
    errorMessage.includes("IP address");

  // Build correct URL with orgSlug
  const exchangesUrl = orgSlug
    ? `${SiteConfig.prodUrl}/orgs/${orgSlug}/account/exchanges`
    : `${SiteConfig.prodUrl}/login`; // Fallback to login if no orgSlug

  return (
    <EmailLayout>
      <Preview>
        ⚠️ Échec de synchronisation {exchange} - {SiteConfig.title}
      </Preview>

      <Heading className="text-2xl font-bold text-gray-900">
        ⚠️ Échec de synchronisation {exchange}
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Nous n'avons pas pu synchroniser tes trades depuis ton exchange{" "}
        <strong>{exchange}</strong>.
      </Text>

      <Section className="my-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-red-900">
          ❌ Erreur détectée
        </Text>
        <Text className="font-mono text-base text-red-900">{errorMessage}</Text>
      </Section>

      {lastSuccessfulSync && (
        <Text className="text-sm text-gray-600">
          Dernière synchronisation réussie :{" "}
          {lastSuccessfulSync.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}

      <Heading className="mt-6 text-lg font-semibold text-gray-900">
        🔧 Comment résoudre ce problème ?
      </Heading>

      {isKeyError ? (
        <>
          <Text className="text-base text-gray-700">
            Cette erreur indique un problème avec tes clés API :
          </Text>

          <Section className="my-6">
            <ul className="list-disc pl-5 text-base text-gray-700">
              <li>
                <strong>Clés expirées ou révoquées</strong> : Vérifie que tes
                clés API sont toujours actives sur Binance
              </li>
              <li>
                <strong>Adresse IP non autorisée</strong> : Si tu as configuré
                des restrictions IP, ajoute les IPs de MyCryptoPilot
              </li>
              <li>
                <strong>Permissions insuffisantes</strong> : Assure-toi que tes
                clés ont les permissions de lecture
              </li>
            </ul>
          </Section>

          <Section className="my-6 text-center">
            <Button
              href={exchangesUrl}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
            >
              🔑 Reconnecter mon exchange
            </Button>
          </Section>
        </>
      ) : (
        <>
          <Text className="text-base text-gray-700">
            Cette erreur est probablement temporaire. Voici ce que tu peux faire
            :
          </Text>

          <Section className="my-6">
            <ul className="list-disc pl-5 text-base text-gray-700">
              <li>
                <strong>Attendre</strong> : La prochaine synchronisation aura
                lieu automatiquement dans 5 minutes
              </li>
              <li>
                <strong>Réessayer manuellement</strong> : Va sur ta page
                Exchanges et clique sur "Sync Now"
              </li>
              <li>
                <strong>Vérifier Binance</strong> : Assure-toi que l'API Binance
                est opérationnelle
              </li>
            </ul>
          </Section>

          <Section className="my-6 text-center">
            <Button
              href={exchangesUrl}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
            >
              📊 Voir mes exchanges
            </Button>
          </Section>
        </>
      )}

      <Section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-blue-900">
          💡 Bon à savoir
        </Text>
        <Text className="text-sm text-blue-900">
          • Tes trades historiques sont conservés en sécurité
          <br />
          • Les statistiques de performance restent accessibles
          <br />
          • Tu ne reçois qu'un seul email par problème (max 1/jour)
          <br />• La synchronisation reprendra automatiquement une fois le
          problème résolu
        </Text>
      </Section>

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

      <Text className="mt-4 text-xs text-gray-400">
        ID de connexion : {connectionId}
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default ExchangeSyncFailureEmail;
