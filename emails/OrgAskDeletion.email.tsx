import { SiteConfig } from "@/site-config";
import { Preview, Text } from "@react-email/components";
import { EmailLayout } from "./utils/EmailLayout";
import { EmailLink, EmailSection, EmailText } from "./utils/components.utils";

export default function OrgAskDeletionEmail({
  org,
  confirmUrl,
}: {
  org: string;
  confirmUrl: string;
}) {
  return (
    <EmailLayout>
      <Preview>Action Required: Organization Deletion</Preview>
      <EmailSection>
        <EmailText>Hi,</EmailText>
        <EmailText>
          You have requested the deletion of the organization <b>{org}</b>. The
          deletion is not yet effective. Please confirm your request by clicking
          the link below:
        </EmailText>
        <EmailText>
          <EmailLink href={confirmUrl}>
            👉 Confirm Organization Deletion 👈
          </EmailLink>
        </EmailText>
        <EmailText>
          You have 1 hour to confirm your request. After, the request will be
          invalid.
        </EmailText>
      </EmailSection>
      <Text className="text-lg leading-6">
        Best,
        <br />- {SiteConfig.maker.name} from {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
