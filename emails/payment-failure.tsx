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

type PaymentFailureEmailProps = {
  userName: string;
  txHash?: string;
  network: "BASE" | "TRON";
  amountUSD: number;
  failureReason:
    | "insufficient_funds"
    | "expired"
    | "network_error"
    | "wrong_amount"
    | "unknown";
  attemptedAt: Date;
};

function getFailureMessageEN(
  reason: PaymentFailureEmailProps["failureReason"],
): string {
  switch (reason) {
    case "insufficient_funds":
      return "Insufficient funds in your wallet";
    case "expired":
      return "Payment session expired (30 minutes timeout)";
    case "network_error":
      return "Network congestion or transaction failed";
    case "wrong_amount":
      return "Wrong amount received";
    case "unknown":
    default:
      return "Unknown error occurred";
  }
}

function getFailureMessageFR(
  reason: PaymentFailureEmailProps["failureReason"],
): string {
  switch (reason) {
    case "insufficient_funds":
      return "Fonds insuffisants dans ton wallet";
    case "expired":
      return "Session de paiement expirée (timeout 30 minutes)";
    case "network_error":
      return "Congestion réseau ou transaction échouée";
    case "wrong_amount":
      return "Montant reçu incorrect";
    case "unknown":
    default:
      return "Erreur inconnue";
  }
}

export function PaymentFailureEmail({
  userName,
  txHash,
  network,
  amountUSD,
  failureReason,
  attemptedAt,
}: PaymentFailureEmailProps) {
  const explorerUrl = txHash
    ? network === "BASE"
      ? `https://basescan.org/tx/${txHash}`
      : `https://tronscan.org/#/transaction/${txHash}`
    : null;

  return (
    <EmailLayout>
      <Preview>
        Payment failed - ${String(amountUSD)} - Paiement échoué -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        ❌ Payment Failed
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Unfortunately, your crypto payment of <strong>${amountUSD}</strong>{" "}
        could not be processed.
      </Text>

      {/* Failure Details Card */}
      <Section className="my-6 rounded-lg border border-red-200 bg-red-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-red-900">
          ⚠️ Payment Details
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-red-800">Amount:</Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-red-900">
                ${amountUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-red-800">Network:</Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-red-900">
                {network === "BASE" ? "Base (USDC)" : "Tron (USDT)"}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-red-800">Reason:</Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-red-900">
                {getFailureMessageEN(failureReason)}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px" }}>
              <Text className="text-sm font-medium text-red-800">
                Attempted at:
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-red-900">
                {attemptedAt.toLocaleString("en-US")}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {explorerUrl && (
        <Section className="my-4 text-center">
          <Button
            href={explorerUrl}
            className="rounded-lg bg-gray-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
          >
            🔗 View Transaction
          </Button>
        </Section>
      )}

      <Section className="my-6">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          🔧 What to do next:
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <strong>Check your wallet balance</strong> - Make sure you have
            enough {network === "BASE" ? "USDC" : "USDT"} + gas fees
          </li>
          <li>
            <strong>Try again</strong> - Start a new payment session from the
            pricing page
          </li>
          <li>
            <strong>Switch network</strong> - Try{" "}
            {network === "BASE" ? "Tron (USDT)" : "Base (USDC)"} if one network
            is congested
          </li>
          <li>
            <strong>Contact support</strong> - If the issue persists, reach out
            to us
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/pricing`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🔄 Try Again
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Need help? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>{" "}
        with your transaction details.
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        ❌ Paiement échoué
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Malheureusement, ton paiement crypto de <strong>${amountUSD}</strong>{" "}
        n'a pas pu être traité.
      </Text>

      {/* Failure Details Card - French */}
      <Section className="my-6 rounded-lg border border-red-200 bg-red-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-red-900">
          ⚠️ Détails du paiement
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-red-800">
                Montant :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-red-900">
                ${amountUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-red-800">Réseau :</Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-red-900">
                {network === "BASE" ? "Base (USDC)" : "Tron (USDT)"}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-red-800">Raison :</Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-red-900">
                {getFailureMessageFR(failureReason)}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px" }}>
              <Text className="text-sm font-medium text-red-800">
                Tentative à :
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-red-900">
                {attemptedAt.toLocaleString("fr-FR")}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {explorerUrl && (
        <Section className="my-4 text-center">
          <Button
            href={explorerUrl}
            className="rounded-lg bg-gray-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
          >
            🔗 Voir la transaction
          </Button>
        </Section>
      )}

      <Section className="my-6">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          🔧 Que faire maintenant :
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <strong>Vérifie le solde de ton wallet</strong> - Assure-toi d'avoir
            assez de {network === "BASE" ? "USDC" : "USDT"} + frais de gas
          </li>
          <li>
            <strong>Réessaie</strong> - Démarre une nouvelle session de paiement
            depuis la page des tarifs
          </li>
          <li>
            <strong>Change de réseau</strong> - Essaie{" "}
            {network === "BASE" ? "Tron (USDT)" : "Base (USDC)"} si un réseau
            est congestionné
          </li>
          <li>
            <strong>Contacte le support</strong> - Si le problème persiste,
            contacte-nous
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/pricing`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🔄 Réessayer
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Besoin d'aide ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>{" "}
        avec les détails de ta transaction.
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default PaymentFailureEmail;
