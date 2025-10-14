import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import type { PropsWithChildren } from "react";
import { TaxSidebar } from "./_navigation/tax-sidebar";
import {
  getOrganizationNavigation,
  toSerializableLinks,
} from "../_navigation/org-navigation.links";

/**
 * Tax Layout
 *
 * Layout pour l'espace Tax & Declaration avec sidebar dédiée
 * Contient: Import CSV, Tax Reports, Transaction History, Export
 */
export default async function TaxLayout({ children }: PropsWithChildren) {
  const org = await getRequiredCurrentOrgCache();
  const userOrganizations = await getUsersOrgs();

  // Get all links for global search (serialized for client component)
  const allLinks = toSerializableLinks(
    getOrganizationNavigation(org.slug, org.memberRoles),
  );

  return (
    <BaseSidebarLayout
      sidebar={
        <TaxSidebar
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
