import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import type { PropsWithChildren } from "react";
import { SchoolSidebar } from "./_navigation/school-sidebar";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import { getAllNavigationLinks } from "../_navigation/navigation-helpers";

/**
 * School Layout
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed org-based queries
 * - Direct user queries
 * - Simplified allLinks generation
 *
 * Layout pour l'espace Crypto School avec sidebar dédiée
 * Contient: Courses, My Learning
 */
export default async function SchoolLayout({ children }: PropsWithChildren) {
  const user = await getRequiredUser();

  // Check if user has trader profile (for conditional TRADER TOOLS section in global search)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  // Get all links for global search (from all 4 spaces)
  const allLinks = getAllNavigationLinks(hasTraderProfile);

  return (
    <BaseSidebarLayout sidebar={<SchoolSidebar allLinks={allLinks} />}>
      {children}
    </BaseSidebarLayout>
  );
}
