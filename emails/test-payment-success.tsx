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

type TestPaymentSuccessEmailProps = {
  userName: string;
  txHash: string;
  network: "BASE" | "TRON";
  amountUSD: number;
  confirmedAt: Date;
  pricingUrl: string;
};

export function TestPaymentSuccessEmail({
  userName = "User",
  txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  network = "BASE",
  amountUSD = 1,
  confirmedAt = new Date(),
  pricingUrl = "https://mycryptopilot.app/orgs/pricing",
}: TestPaymentSuccessEmailProps) {
  const explorerUrl =
    network === "BASE"
      ? `https://basescan.org/tx/${txHash}`
      : `https://tronscan.org/#/transaction/${txHash}`;

  return (
    <EmailLayout>
      <Preview>
        Test Payment Confirmed - Paiement de test confirmé - {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎉 Test Payment Successful!
      </Heading>

      <Text className="text-base text-gray-700">Hello {userName},</Text>

      <Text className="text-base text-gray-700">
        Great news! Your test payment of <strong>${amountUSD}</strong> has been
        confirmed on-chain. The crypto payment system is working perfectly!
      </Text>

      <Section className="my-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-green-900">
          ✓ Payment Details
        </Text>
        <ul className="list-none pl-0 text-sm text-green-800">
          <li>
            <strong>Amount:</strong> ${amountUSD} USD
          </li>
          <li style={{ marginTop: "4px" }}>
            <strong>Network:</strong>{" "}
            {network === "BASE" ? "Base (USDC)" : "Tron (USDT)"}
          </li>
          <li style={{ marginTop: "4px" }}>
            <strong>Status:</strong> Confirmed
          </li>
          <li style={{ marginTop: "4px" }}>
            <strong>Time:</strong> {confirmedAt.toLocaleString()}
          </li>
        </ul>
      </Section>

      <Text className="text-base text-gray-700">
        You can view your transaction on the blockchain explorer:
      </Text>

      <Section className="my-4 text-center">
        <Button
          href={explorerUrl}
          className="rounded-lg bg-gray-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          View Transaction
        </Button>
      </Section>

      <Section className="my-6">
        <Heading className="text-lg font-bold text-gray-900">
          What's Next?
        </Heading>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <strong>You've verified the system works</strong> - Crypto payments
            are processed automatically
          </li>
          <li>
            <strong>The test payment is in your history</strong> - Check your
            dashboard to see it
          </li>
          <li>
            <strong>Ready to subscribe?</strong> - Choose Pro or Ultra plan to
            get full access
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={pricingUrl}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          View Plans & Subscribe
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Questions about crypto payments? Contact us at{" "}
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
        🎉 Paiement de test réussi !
      </Heading>

      <Text className="text-base text-gray-700">Bonjour {userName},</Text>

      <Text className="text-base text-gray-700">
        Bonne nouvelle ! Ton paiement de test de <strong>${amountUSD}</strong> a
        été confirmé on-chain. Le système de paiement crypto fonctionne
        parfaitement !
      </Text>

      <Section className="my-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-green-900">
          ✓ Détails du paiement
        </Text>
        <ul className="list-none pl-0 text-sm text-green-800">
          <li>
            <strong>Montant :</strong> ${amountUSD} USD
          </li>
          <li style={{ marginTop: "4px" }}>
            <strong>Réseau :</strong>{" "}
            {network === "BASE" ? "Base (USDC)" : "Tron (USDT)"}
          </li>
          <li style={{ marginTop: "4px" }}>
            <strong>Statut :</strong> Confirmé
          </li>
          <li style={{ marginTop: "4px" }}>
            <strong>Heure :</strong> {confirmedAt.toLocaleString("fr-FR")}
          </li>
        </ul>
      </Section>

      <Text className="text-base text-gray-700">
        Tu peux voir ta transaction sur l'explorateur de blockchain :
      </Text>

      <Section className="my-4 text-center">
        <Button
          href={explorerUrl}
          className="rounded-lg bg-gray-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Voir la transaction
        </Button>
      </Section>

      <Section className="my-6">
        <Heading className="text-lg font-bold text-gray-900">
          Et maintenant ?
        </Heading>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <strong>Tu as vérifié que le système fonctionne</strong> - Les
            paiements crypto sont traités automatiquement
          </li>
          <li>
            <strong>Le paiement de test est dans ton historique</strong> -
            Consulte ton dashboard pour le voir
          </li>
          <li>
            <strong>Prêt à t'abonner ?</strong> - Choisis le plan Pro ou Ultra
            pour un accès complet
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={pricingUrl}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Voir les plans & S'abonner
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Questions sur les paiements crypto ? Contacte-nous à{" "}
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
export default TestPaymentSuccessEmail;
