import { SiteConfig } from "@/site-config";
import { Preview, Section, Text } from "@react-email/components";
import { EmailLayout } from "./utils/EmailLayout";

export default function AccountConfirmDeletionEmail() {
  return (
    <EmailLayout>
      <Preview>
        Your account has been deleted. All your data, including any
        organizations you owned, have been removed from our system.
      </Preview>
      <Section className="my-6">
        <Text className="text-lg leading-6">Hi,</Text>
        <Text className="text-lg leading-6">
          We wanted to let you know that your account has been permanently
          deleted. All your data, including any organizations you owned, have
          been removed from our system.
        </Text>
        <Text className="text-lg leading-6">
          If you have any questions or need further assistance, please do not
          hesitate to contact our support team.
        </Text>
      </Section>
      <Text className="text-lg leading-6">
        Best,
        <br />- {SiteConfig.maker.name} from {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
