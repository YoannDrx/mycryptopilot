import { SiteConfig } from "@/site-config";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import {
  Button,
  Heading,
  Hr,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type PaymentSuccessEmailProps = {
  userName: string;
  txHash: string;
  network: "BASE" | "TRON";
  amountUSD: number;
  confirmedAt: Date;
  plan: MyCryptoPilotPlanName;
  periodEnd: Date;
};

export function PaymentSuccessEmail({
  userName = "User",
  txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  network = "BASE",
  amountUSD = 49,
  confirmedAt = new Date(),
  plan = "pro",
  periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
}: PaymentSuccessEmailProps) {
  const explorerUrl =
    network === "BASE"
      ? `https://basescan.org/tx/${txHash}`
      : `https://tronscan.org/#/transaction/${txHash}`;

  const planDisplayName =
    plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Ultra";

  return (
    <EmailLayout>
      <Preview>
        Payment confirmed - ${String(amountUSD)} - Paiement confirmé -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        💸 Payment Confirmed!
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Great news! Your crypto payment has been confirmed on-chain. Your{" "}
        <strong>{planDisplayName}</strong> subscription is now active!
      </Text>

      {/* Payment Details Card */}
      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          ✓ Payment Details
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Amount:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                ${amountUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Network:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {network === "BASE" ? "Base (USDC)" : "Tron (USDT)"}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Plan:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {planDisplayName}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Valid until:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {periodEnd.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Confirmed at:
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-emerald-900">
                {confirmedAt.toLocaleString("en-US")}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section className="my-4 text-center">
        <Button
          href={explorerUrl}
          className="rounded-lg bg-gray-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🔗 View Transaction on Blockchain
        </Button>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🚀 Access your Dashboard
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        🧾 <strong>Transaction ID:</strong>{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
          {txHash.slice(0, 16)}...{txHash.slice(-8)}
        </code>
      </Text>

      <Text className="text-sm text-gray-500">
        Questions about your payment? Contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          style={{ color: "#10b981" }}
          className="no-underline"
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
        💸 Paiement confirmé !
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Bonne nouvelle ! Ton paiement crypto a été confirmé on-chain. Ton
        abonnement <strong>{planDisplayName}</strong> est maintenant actif !
      </Text>

      {/* Payment Details Card - French */}
      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          ✓ Détails du paiement
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Montant :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                ${amountUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Réseau :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {network === "BASE" ? "Base (USDC)" : "Tron (USDT)"}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Plan :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {planDisplayName}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Valable jusqu'au :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {periodEnd.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Confirmé à :
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-emerald-900">
                {confirmedAt.toLocaleString("fr-FR")}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section className="my-4 text-center">
        <Button
          href={explorerUrl}
          className="rounded-lg bg-gray-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🔗 Voir la transaction sur la blockchain
        </Button>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🚀 Accéder à ton Dashboard
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        🧾 <strong>ID de transaction :</strong>{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
          {txHash.slice(0, 16)}...{txHash.slice(-8)}
        </code>
      </Text>

      <Text className="text-sm text-gray-500">
        Questions sur ton paiement ? Contacte-nous à{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          style={{ color: "#10b981" }}
          className="no-underline"
        >
          {SiteConfig.email.contact}
        </a>
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default PaymentSuccessEmail;
