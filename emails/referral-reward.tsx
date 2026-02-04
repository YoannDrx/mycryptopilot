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

type ReferralRewardEmailProps = {
  userName: string;
  referredUserName: string;
  rewardAmountUSD: number;
  totalEarnedUSD: number;
  referralCount: number;
  creditedAt: Date;
};

export function ReferralRewardEmail({
  userName,
  referredUserName,
  rewardAmountUSD,
  totalEarnedUSD,
  referralCount,
  creditedAt,
}: ReferralRewardEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        You earned ${String(rewardAmountUSD)}! - Tu as gagné $
        {String(rewardAmountUSD)} ! - {SiteConfig.title}
      </Preview>

      {/* English Section */}
      <Text className="mt-4 mb-3 text-sm font-semibold text-gray-600">
        🇬🇧 English
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎁 Referral Reward Credited!
      </Heading>

      <Text className="text-base text-gray-700">
        Hello <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Great news! <strong>{referredUserName}</strong> subscribed using your
        referral link, and you've earned a reward!
      </Text>

      {/* Reward Card */}
      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          💰 Reward Details
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                This reward:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-xl font-bold text-emerald-900">
                +${rewardAmountUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Total earned:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                ${totalEarnedUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Total referrals:
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {referralCount} user{referralCount > 1 ? "s" : ""}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Credited at:
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-emerald-900">
                {creditedAt.toLocaleString("en-US")}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-amber-900">
          💡 How to use your credit
        </Text>
        <Text className="text-sm text-amber-800">
          Your referral credit is automatically applied to your next
          subscription payment. You can also use it to extend your current plan!
        </Text>
      </Section>

      <Section className="my-6">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          🚀 Keep earning:
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <strong>$10</strong> for every Pro subscription referral
          </li>
          <li>
            <strong>$25</strong> for every Ultra subscription referral
          </li>
          <li>
            <strong>No limit</strong> on how much you can earn
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/account/referrals`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          📊 View Referral Dashboard
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Share your referral link with more traders to earn even more! 🎯
      </Text>

      {/* Horizontal Separator */}
      <Hr className="my-8 border-gray-300" />

      {/* French Section */}
      <Text className="mb-3 text-sm font-semibold text-gray-600">
        🇫🇷 Français
      </Text>

      <Heading className="text-2xl font-bold text-gray-900">
        🎁 Récompense de parrainage créditée !
      </Heading>

      <Text className="text-base text-gray-700">
        Bonjour <strong>{userName}</strong>,
      </Text>

      <Text className="text-base text-gray-700">
        Bonne nouvelle ! <strong>{referredUserName}</strong> s'est abonné via
        ton lien de parrainage, et tu as gagné une récompense !
      </Text>

      {/* Reward Card - French */}
      <Section className="my-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <Text className="mb-4 text-lg font-semibold text-emerald-900">
          💰 Détails de la récompense
        </Text>
        <table>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Cette récompense :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-xl font-bold text-emerald-900">
                +${rewardAmountUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Total gagné :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                ${totalEarnedUSD} USD
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px", paddingBottom: "8px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Total parrainages :
              </Text>
            </td>
            <td style={{ paddingBottom: "8px" }}>
              <Text className="text-base font-bold text-emerald-900">
                {referralCount} utilisateur{referralCount > 1 ? "s" : ""}
              </Text>
            </td>
          </tr>
          <tr>
            <td style={{ paddingRight: "16px" }}>
              <Text className="text-sm font-medium text-emerald-800">
                Crédité à :
              </Text>
            </td>
            <td>
              <Text className="text-base font-bold text-emerald-900">
                {creditedAt.toLocaleString("fr-FR")}
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <Text className="mb-2 text-sm font-semibold text-amber-900">
          💡 Comment utiliser ton crédit
        </Text>
        <Text className="text-sm text-amber-800">
          Ton crédit de parrainage est automatiquement appliqué à ton prochain
          paiement d'abonnement. Tu peux aussi l'utiliser pour prolonger ton
          plan actuel !
        </Text>
      </Section>

      <Section className="my-6">
        <Text className="mb-3 text-base font-semibold text-gray-900">
          🚀 Continue à gagner :
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>
            <strong>$10</strong> pour chaque parrainage Pro
          </li>
          <li>
            <strong>$25</strong> pour chaque parrainage Ultra
          </li>
          <li>
            <strong>Pas de limite</strong> sur ce que tu peux gagner
          </li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={`${SiteConfig.prodUrl}/account/referrals`}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          📊 Voir le Dashboard de Parrainage
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        Partage ton lien de parrainage avec plus de traders pour gagner encore
        plus ! 🎯
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default ReferralRewardEmail;
