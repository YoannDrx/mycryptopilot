import { SiteConfig } from "@/site-config";
import { Button, Preview, Section, Text } from "@react-email/components";
import { EmailLayout } from "./utils/EmailLayout";

export default function AccountAskDeletionEmail({
  organizationsToDelete,
  confirmUrl,
}: {
  email: string;
  organizationsToDelete: string[];
  confirmUrl: string;
}) {
  return (
    <EmailLayout>
      <Preview>
        Action required : You need to confirm your account deletion.
      </Preview>
      <Section className="my-6">
        <Text className="text-lg leading-6">Hi,</Text>
        <Text className="text-lg leading-6">
          You have requested the deletion of your account. The deletion is not
          yet effective. Please confirm your request by clicking the link below:
        </Text>
        <Button
          href={confirmUrl}
          className="rounded-md bg-black px-6 py-4 text-lg leading-6 text-white"
        >
          Confirm Account Deletion
        </Button>
        <Text>
          You have 1 hour to confirm your request. After, the request will be
          invalid.
        </Text>
        {organizationsToDelete.length > 0 && (
          <Text className="text-lg leading-6">
            The following organizations will also be deleted:
            <ul>
              {organizationsToDelete.map((org) => (
                <li key={org}>{org}</li>
              ))}
            </ul>
          </Text>
        )}
      </Section>
      <Text className="text-lg leading-6">
        Best,
        <br />- {SiteConfig.maker.name} from {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
