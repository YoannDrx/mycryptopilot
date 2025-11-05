import { getOrgOrStub } from "@/lib/react/org-cache-dual";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import type { PropsWithChildren } from "react";
import { AppSidebar } from "./_navigation/app-sidebar";
import {
  getOrganizationNavigation,
  toSerializableLinks,
} from "../orgs/[orgSlug]/(navigation)/_navigation/org-navigation.links";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import OrgBreadcrumb from "../orgs/[orgSlug]/(navigation)/_navigation/org-breadcrumb";

/**
 * App Layout (Root-Level Routes)
 *
 * Layout pour les nouvelles routes racine (Phase 5a)
 * Compatible avec le système dual-mode via getOrgOrStub()
 *
 * Similaire à TradingLayout mais pour les routes:
 * - /dashboard
 * - /signals
 * - /traders
 * - /pricing
 * - /account
 *
 * Phase 5a: Routes principales migrées
 * Phase 5b: Sub-routes restent sous /orgs/:slug/ avec redirections 307
 */
export default async function AppLayout({ children }: PropsWithChildren) {
  const org = await getOrgOrStub();
  const user = await getRequiredUser();
  const userOrganizations = await getUsersOrgs();

  // Check if user has trader profile (for conditional TRADER TOOLS section)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  // Get all links for global search (serialized for client component)
  const allLinks = toSerializableLinks(
    getOrganizationNavigation(org.slug, org.memberRoles),
  );

  return (
    <SidebarProvider>
      <AppSidebar
        slug={org.slug}
        userOrgs={userOrganizations}
        allLinks={allLinks}
        hasTraderProfile={hasTraderProfile}
      />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger
            size="lg"
            variant="outline"
            className="size-9 cursor-pointer"
          />
          <OrgBreadcrumb />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
