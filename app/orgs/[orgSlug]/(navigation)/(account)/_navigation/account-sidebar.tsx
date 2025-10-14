"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavigationMenu } from "@/components/ui/sidebar-utils";
import { ContactFeedbackPopover } from "@/features/contact/feedback/contact-feedback-popover";
import type { NavigationGroup } from "@/features/navigation/navigation.type";
import type { SerializableGroup } from "../../_navigation/global-search-command";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import type { AuthOrganization } from "@/lib/auth/auth-type";
import { GlobalSearchCommand } from "../../_navigation/global-search-command";
import { OrgsSelect } from "../../_navigation/orgs-select";
import { UpgradeCard } from "../../_navigation/upgrade-org-card";
import { ACCOUNT_LINKS } from "./account-links";

/**
 * Account Sidebar
 *
 * Sidebar dédiée à l'espace Account Settings
 * Affiche uniquement les 5 liens Account
 */
export function AccountSidebar({
  slug,
  userOrgs,
  allLinks,
}: {
  slug: string;
  userOrgs: AuthOrganization[];
  allLinks: SerializableGroup[];
}) {
  // Replace slug in all links
  const links = ACCOUNT_LINKS.map((link) => ({
    ...link,
    href: link.href.replace(":organizationSlug", slug),
  }));

  const navigationGroup: NavigationGroup = {
    title: "Account Settings",
    links,
  };

  return (
    <Sidebar variant="inset" suppressHydrationWarning>
      <SidebarHeader className="flex flex-col gap-2">
        <OrgsSelect orgs={userOrgs} currentOrgSlug={slug} />
        <GlobalSearchCommand orgSlug={slug} allLinks={allLinks} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarNavigationMenu link={navigationGroup} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <UpgradeCard />
        <ContactFeedbackPopover />
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
