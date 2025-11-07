import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { EmailPreferencesForm } from "./_components/email-preferences-form";
import {
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
  LayoutContent,
} from "@/features/page/layout";
import { Mail } from "lucide-react";

export const generateMetadata = combineWithParentMetadata({
  title: "Email Preferences",
  description: "Manage your email notification preferences.",
});

export default async function EmailPreferencesPage() {
  const user = await getRequiredUser();

  const userPreferences = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      emailNotificationsEnabled: true,
      emailNotifyNewSignals: true,
      emailNotifySubscriptionReminders: true,
      emailNotifyExchangeSyncFailures: true,
      emailNotifyTraderInvitations: true,
      emailNotifyWeeklyPerformance: true,
      emailNotifyMarketingUpdates: true,
    },
  });

  if (!userPreferences) {
    // Should never happen since user is required
    throw new Error("User preferences not found");
  }

  return (
    <>
      <LayoutHeader className="flex flex-row items-center gap-3">
        <div className="bg-primary/10 text-primary flex items-center justify-center rounded-lg p-2">
          <Mail className="size-5" />
        </div>
        <div>
          <LayoutTitle>Email Preferences</LayoutTitle>
          <LayoutDescription>
            Manage your email notifications and preferences
          </LayoutDescription>
        </div>
      </LayoutHeader>

      <LayoutContent>
        <EmailPreferencesForm initialPreferences={userPreferences} />
      </LayoutContent>
    </>
  );
}
