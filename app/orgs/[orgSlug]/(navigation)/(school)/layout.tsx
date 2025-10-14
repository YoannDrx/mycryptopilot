import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import type { PropsWithChildren } from "react";
import { SchoolSidebar } from "./_navigation/school-sidebar";
import {
  getOrganizationNavigation,
  toSerializableLinks,
} from "../_navigation/org-navigation.links";

/**
 * School Layout
 *
 * Layout pour l'espace Crypto School avec sidebar dédiée
 * Contient: Courses, Lessons, Progress, Certificates
 */
export default async function SchoolLayout({ children }: PropsWithChildren) {
  const org = await getRequiredCurrentOrgCache();
  const userOrganizations = await getUsersOrgs();

  // Get all links for global search (serialized for client component)
  const allLinks = toSerializableLinks(
    getOrganizationNavigation(org.slug, org.memberRoles),
  );

  return (
    <BaseSidebarLayout
      sidebar={
        <SchoolSidebar
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
