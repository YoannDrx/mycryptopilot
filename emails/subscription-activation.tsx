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

type SubscriptionActivationEmailProps = {
  userName: string;
  plan: MyCryptoPilotPlanName;
  periodEnd: Date;
  isExtension: boolean;
};

function getPlanFeatures(plan: MyCryptoPilotPlanName): {
  en: string[];
  fr: string[];
} {
  switch (plan) {
    case "free":
      return {
        en: [
          "5 trading signals per day",
          "Follow 1 trader",
          "Access to public marketplace",
        ],
        fr: [
          "5 signaux de trading par jour",
          "Suivre 1 trader",
          "Accès à la marketplace publique",
        ],
      };
    case "pro":
      return {
        en: [
          "50 trading signals per day",
          "Follow up to 5 traders",
          "Risk console & trading journal",
          "1-minute screener refresh",
        ],
        fr: [
          "50 signaux de trading par jour",
          "Suivre jusqu'à 5 traders",
          "Console de risque & journal de trading",
          "Refresh screener 1 minute",
        ],
      };
    case "ultra":
      return {
        en: [
          "Unlimited trading signals",
          "Follow unlimited traders",
          "Advanced risk console & analytics",
          "5-second screener refresh",
          "Custom alerts",
          "Priority support",
        ],
        fr: [
          "Signaux de trading illimités",
          "Suivre un nombre illimité de traders",
          "Console de risque & analytics avancés",
          "Refresh screener 5 secondes",
          "Alertes personnalisées",
          "Support prioritaire",
        ],
      };
    default:
      return { en: [], fr: [] };
  }
}

export function SubscriptionActivationEmail({
  userName = "User",
  plan = "pro",
  periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isExtension = false,
}: SubscriptionActivationEmailProps) {
  const planDisplayName =
    plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Ultra";
  const actionVerbEN = isExtension ? "extended" : "activated";
  const actionVerbFR = isExtension ? "prolongé" : "activé";
  const actionTitleEN = isExtension ? "Extended" : "Activated";
  const actionTitleFR = isExtension ? "Prolongé" : "Activé";

  const features = getPlanFeatures(plan);

  return (
    <EmailLayout>
      <Preview>
        Subscription {actionVerbEN} - Abonnement {actionVerbFR} -{" "}
        {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎉 Subscription {actionTitleEN}!
      </Heading>

      <Text className="text-base text-gray-700">
        Hi <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Your <strong>{planDisplayName}</strong> plan has been successfully{" "}
        {actionVerbEN}!
      </Text>

      {/* Plan Details Card */}
      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          📋 Plan Details
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "12px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-900">
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
            <td style={{ paddingRight: "12px" }}>
              <Text className="text-sm font-medium text-emerald-900">
                Valid until:
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-emerald-900">
                {periodEnd.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Features */}
      <Text className="mb-3 text-base font-semibold text-gray-900">
        ✨ What's included:
      </Text>

      <Section className="mb-6">
        <ul className="list-disc pl-5 text-base text-gray-700">
          {features.en.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🚀 Access your dashboard
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        You can now access all {planDisplayName} features on{" "}
        <a
          href={SiteConfig.prodUrl}
          style={{ color: "#10b981", textDecoration: "underline" }}
        >
          {SiteConfig.title}
        </a>
        . If you have any questions, feel free to reply to this email.
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎉 Abonnement {actionTitleFR} !
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Ton abonnement <strong>{planDisplayName}</strong> a été {actionVerbFR}{" "}
        avec succès !
      </Text>

      {/* Plan Details Card - French */}
      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          📋 Détails du plan
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "12px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-900">
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
            <td style={{ paddingRight: "12px" }}>
              <Text className="text-sm font-medium text-emerald-900">
                Valable jusqu'au :
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-emerald-900">
                {periodEnd.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Features - French */}
      <Text className="mb-3 text-base font-semibold text-gray-900">
        ✨ Ce qui est inclus :
      </Text>

      <Section className="mb-6">
        <ul className="list-disc pl-5 text-base text-gray-700">
          {features.fr.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/orgs/dashboard`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          🚀 Accéder à ton tableau de bord
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Tu peux maintenant accéder à toutes les fonctionnalités{" "}
        {planDisplayName} sur{" "}
        <a
          href={SiteConfig.prodUrl}
          style={{ color: "#10b981", textDecoration: "underline" }}
        >
          {SiteConfig.title}
        </a>
        . Si tu as des questions, n'hésite pas à répondre à cet email.
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default SubscriptionActivationEmail;
