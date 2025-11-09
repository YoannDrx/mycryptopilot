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

type ExchangeSyncFailureEmailProps = {
  userName: string;
  exchange: string;
  errorMessage: string;
  lastSuccessfulSync?: Date;
  connectionId: string;
  exchangesUrl: string;
};

export function ExchangeSyncFailureEmail({
  userName,
  exchange,
  errorMessage,
  lastSuccessfulSync,
  connectionId,
  exchangesUrl,
}: ExchangeSyncFailureEmailProps) {
  const isKeyError =
    errorMessage.includes("Invalid API") ||
    errorMessage.includes("401") ||
    errorMessage.includes("IP address");

  return (
    <EmailLayout>
      <Preview>
        ⚠️ {exchange} sync failure - Échec de synchronisation {exchange} -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        ⚠️ {exchange} Sync Failure
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        We couldn't synchronize your trades from your{" "}
        <strong>{exchange}</strong> exchange.
      </Text>

      <Section className="my-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-red-900">
          ❌ Error Detected
        </Text>
        <Text className="font-mono text-base text-red-900">{errorMessage}</Text>
      </Section>

      {lastSuccessfulSync && (
        <Text className="text-sm text-gray-600">
          Last successful sync:{" "}
          {lastSuccessfulSync.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}

      <Heading className="mt-6 text-lg font-semibold text-gray-900">
        🔧 How to Fix This?
      </Heading>

      {isKeyError ? (
        <>
          <Text className="text-base text-gray-700">
            This error indicates a problem with your API keys:
          </Text>

          <Section className="my-6">
            <ul className="list-disc pl-5 text-base text-gray-700">
              <li>
                <strong>Expired or revoked keys</strong>: Verify your API keys
                are still active on {exchange}
              </li>
              <li>
                <strong>Unauthorized IP address</strong>: If you configured IP
                restrictions, add MyCryptoPilot's IPs
              </li>
              <li>
                <strong>Insufficient permissions</strong>: Ensure your keys have
                read permissions
              </li>
            </ul>
          </Section>

          <Section className="my-6 text-center">
            <Button
              href={exchangesUrl}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
            >
              🔑 Reconnect my exchange
            </Button>
          </Section>
        </>
      ) : (
        <>
          <Text className="text-base text-gray-700">
            This error is probably temporary. Here's what you can do:
          </Text>

          <Section className="my-6">
            <ul className="list-disc pl-5 text-base text-gray-700">
              <li>
                <strong>Wait</strong>: The next sync will happen automatically
                in 5 minutes
              </li>
              <li>
                <strong>Retry manually</strong>: Go to your Exchanges page and
                click "Sync Now"
              </li>
              <li>
                <strong>Check {exchange}</strong>: Make sure the {exchange} API
                is operational
              </li>
            </ul>
          </Section>

          <Section className="my-6 text-center">
            <Button
              href={exchangesUrl}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
            >
              📊 View my exchanges
            </Button>
          </Section>
        </>
      )}

      <Section className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-blue-900">
          💡 Good to know
        </Text>
        <Text className="text-sm text-blue-900">
          • Your historical trades are safely stored
          <br />
          • Performance statistics remain accessible
          <br />
          • You only receive one email per issue (max 1/day)
          <br />• Synchronization will resume automatically once the issue is
          resolved
        </Text>
      </Section>

      <Text className="text-sm text-gray-500">
        Questions? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>
        .
      </Text>

      <Text className="mt-4 text-xs text-gray-400">
        Connection ID: {connectionId}
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

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
                clés API sont toujours actives sur {exchange}
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
                <strong>Vérifier {exchange}</strong> : Assure-toi que l'API{" "}
                {exchange} est opérationnelle
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
