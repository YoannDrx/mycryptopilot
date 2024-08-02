import { SiteConfig } from "@/site-config";
import { Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./utils/EmailLayout";

export default function OrgAskDeletionEmail({
  org,
  confirmUrl,
}: {
  email: string;
  org: string;
  confirmUrl: string;
}) {
  return (
    <EmailLayout>
      <Section className="my-6">
        <Text className="text-lg leading-6">Hi,</Text>
        <Text className="text-lg leading-6">
          You have requested the deletion of the organization {org}. The
          deletion is not yet effective. Please confirm your request by clicking
          the link below:
        </Text>
        <Text className="text-lg leading-6">
          <Link className="text-sky-500 hover:underline" href={confirmUrl}>
            Confirm Account Deletion
          </Link>
        </Text>
      </Section>
      <Text className="text-lg leading-6">
        Best,
        <br />- {SiteConfig.maker.name} from {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
