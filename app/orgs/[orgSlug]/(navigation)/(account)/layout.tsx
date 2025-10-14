import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import type { PropsWithChildren } from "react";
import { AccountSidebar } from "./_navigation/account-sidebar";
import {
  getOrganizationNavigation,
  toSerializableLinks,
} from "../_navigation/org-navigation.links";

/**
 * Account Layout
 *
 * Layout pour l'espace Account Settings avec sidebar dédiée
 * Contient: Profile, Discord, Email, Following, Danger Zone
 */
export default async function AccountLayout({ children }: PropsWithChildren) {
  const org = await getRequiredCurrentOrgCache();
  const userOrganizations = await getUsersOrgs();

  // Get all links for global search (serialized for client component)
  const allLinks = toSerializableLinks(
    getOrganizationNavigation(org.slug, org.memberRoles),
  );

  return (
    <BaseSidebarLayout
      sidebar={
        <AccountSidebar
          slug={org.slug}
          userOrgs={userOrganizations}
          allLinks={allLinks}
        />
      }
    >
      {children}
    </BaseSidebarLayout>
  );
}
