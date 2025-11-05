"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavigationMenu } from "@/components/ui/sidebar-utils";
import { ContactFeedbackPopover } from "@/features/contact/feedback/contact-feedback-popover";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import type { AuthOrganization } from "@/lib/auth/auth-type";
import {
  GlobalSearchCommand,
  type SerializableGroup,
} from "../../orgs/[orgSlug]/(navigation)/_navigation/global-search-command";
import { OrgsSelect } from "../../orgs/[orgSlug]/(navigation)/_navigation/orgs-select";
import { UpgradeCard } from "../../orgs/[orgSlug]/(navigation)/_navigation/upgrade-org-card";
import { getAppNavigationGroups } from "./app-links";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * App Sidebar (Root-Level Routes)
 *
 * Sidebar pour les nouvelles routes racine (Phase 5a)
 * Similaire à TradingSidebar mais adapté au dual-mode
 *
 * Différences vs TradingSidebar:
 * - Utilise getAppNavigationGroups() avec liens racine
 * - Remplace :organizationSlug par slug fourni
 * - Compatible mode legacy ET nouveau
 */
export function AppSidebar({
  slug,
  userOrgs,
  allLinks,
  hasTraderProfile,
}: {
  slug: string;
  userOrgs: AuthOrganization[];
  allLinks: SerializableGroup[];
  hasTraderProfile: boolean;
}) {
  // Get navigation groups with conditional TRADER TOOLS section
  const navigationGroups = getAppNavigationGroups(hasTraderProfile);

  // Replace slug in all groups
  const groupsWithReplacedSlugs = navigationGroups.map((group) => ({
    ...group,
    links: group.links.map((link) => ({
      ...link,
      href: link.href.replace(":organizationSlug", slug),
    })),
  }));

  // State for collapsible sections (all open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(groupsWithReplacedSlugs.map((g) => [g.title, true])),
  );

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar variant="inset" suppressHydrationWarning>
      <SidebarHeader className="flex flex-col gap-2">
        <OrgsSelect orgs={userOrgs} currentOrgSlug={slug} />
        <GlobalSearchCommand orgSlug={slug} allLinks={allLinks} />
      </SidebarHeader>
      <SidebarContent suppressHydrationWarning>
        {groupsWithReplacedSlugs.map((group) => (
          <Collapsible
            key={group.title}
            open={openSections[group.title]}
            onOpenChange={() => toggleSection(group.title)}
            suppressHydrationWarning
          >
            <SidebarGroup suppressHydrationWarning>
              <CollapsibleTrigger className="w-full [&[data-state=open]>div>svg]:rotate-180">
                <SidebarGroupLabel className="text-muted-foreground group/label hover:text-foreground flex w-full cursor-pointer items-center justify-between text-xs font-semibold tracking-wider uppercase transition-colors">
                  <span>{group.title}</span>
                  <ChevronDown className="size-4 transition-transform duration-200" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarNavigationMenu link={group} />
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
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
