import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import type { PropsWithChildren } from "react";
import { TradingSidebar } from "./_navigation/trading-sidebar";
import {
  getOrganizationNavigation,
  toSerializableLinks,
} from "../_navigation/org-navigation.links";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";

/**
 * Trading Layout
 *
 * Layout pour l'espace Trading avec sidebar dédiée
 * Contient: Dashboard, Signals, Traders, Pricing, Checkout
 * Sidebar conditionnelle selon le rôle (trader ou consumer)
 */
export default async function TradingLayout({ children }: PropsWithChildren) {
  const org = await getRequiredCurrentOrgCache();
  const user = await getRequiredUser();
  const userOrganizations = await getUsersOrgs();

  // Check if user has trader profile (for conditional TRADER TOOLS section)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  // Get all links for global search (serialized for client component)
  const allLinks = toSerializableLinks(
    getOrganizationNavigation(org.slug, org.memberRoles),
  );

  return (
    <BaseSidebarLayout
      sidebar={
        <TradingSidebar
          slug={org.slug}
          userOrgs={userOrganizations}
          allLinks={allLinks}
          hasTraderProfile={hasTraderProfile}
        />
      }
    >
      {children}
    </BaseSidebarLayout>
  );
}
