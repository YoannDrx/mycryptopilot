import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { EmailPreferencesForm } from "./_components/email-preferences-form";

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

  return <EmailPreferencesForm initialPreferences={userPreferences} />;
}
