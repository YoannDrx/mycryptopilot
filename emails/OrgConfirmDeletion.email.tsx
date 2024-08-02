import { SiteConfig } from "@/site-config";
import { Preview, Section, Text } from "@react-email/components";
import { EmailLayout } from "./utils/EmailLayout";

export default function OrgConfirmDeletionEmail({
  org,
}: {
  email: string;
  org: string;
}) {
  return (
    <EmailLayout>
      <Preview>
        Your organization has been deleted. All your data, including any
        organizations you owned, have been removed from our system.
      </Preview>
      <Section className="my-6">
        <Text className="text-lg leading-6">Hi,</Text>
        <Text className="text-lg leading-6">
          We just wanted to let you know that the organization {org} has been
          permanently deleted. All your data, including any organizations you
          owned, have been removed from our system.
        </Text>
      </Section>
      <Text className="text-lg leading-6">
        Best,
        <br />- {SiteConfig.maker.name} from {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
