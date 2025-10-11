import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type TraderInvitationEmailProps = {
  traderName: string;
  invitationUrl: string;
};

export function TraderInvitationEmail({
  traderName,
  invitationUrl,
}: TraderInvitationEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        {traderName} invited you to follow them on {SiteConfig.title}
      </Preview>

      <Heading className="text-2xl font-bold text-gray-900">
        You've been invited to follow {traderName}!
      </Heading>

      <Text className="text-base text-gray-700">
        <strong>{traderName}</strong> wants to share their trading signals with
        you on <strong>{SiteConfig.title}</strong>.
      </Text>

      <Section className="my-6">
        <Text className="text-base text-gray-700">
          By following {traderName}, you'll get:
        </Text>
        <ul className="list-disc pl-5 text-base text-gray-700">
          <li>Real-time Discord notifications for new signals</li>
          <li>Access to their trading track record</li>
          <li>Professional trading insights and analysis</li>
        </ul>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={invitationUrl}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
        >
          Follow {traderName}
        </Button>
      </Section>

      <Text className="text-sm text-gray-500">
        This invitation will expire in 7 days. If you didn't expect this
        invitation, you can safely ignore this email.
      </Text>

      <Text className="text-sm text-gray-500">
        Questions? Visit our{" "}
        <a
          href={`${SiteConfig.prodUrl}/docs`}
          className="text-indigo-600 no-underline"
        >
          documentation
        </a>{" "}
        or contact us at{" "}
        <a
          href={`mailto:${SiteConfig.email.contact}`}
          className="text-indigo-600 no-underline"
        >
          {SiteConfig.email.contact}
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

// Default export for React Email dev server
export default TraderInvitationEmail;
