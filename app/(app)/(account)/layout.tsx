import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import type { PropsWithChildren } from "react";
import { AccountSidebar } from "./_navigation/account-sidebar";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import { getAllNavigationLinks } from "../_navigation/navigation-helpers";

/**
 * Account Layout
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed org-based queries
 * - Direct user queries
 * - Simplified allLinks generation
 *
 * Layout pour l'espace Account Settings avec sidebar dédiée
 * Contient: Profile, Discord, Email, Following, Danger Zone
 */
export default async function AccountLayout({ children }: PropsWithChildren) {
  const user = await getRequiredUser();

  // Check if user has trader profile (for conditional TRADER TOOLS section in global search)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  // Get all links for global search (from all 4 spaces)
  const allLinks = getAllNavigationLinks(hasTraderProfile);

  return (
    <BaseSidebarLayout sidebar={<AccountSidebar allLinks={allLinks} />}>
      {children}
    </BaseSidebarLayout>
  );
}
