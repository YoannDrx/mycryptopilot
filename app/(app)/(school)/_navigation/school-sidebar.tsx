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
import { GlobalSearchCommand } from "../../_navigation/global-search-command";
import { SCHOOL_LINKS } from "./school-links";

/**
 * School Sidebar
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed OrgsSelect (not needed)
 * - No slug replacement (links already use direct URLs)
 * - Simplified header
 *
 * Sidebar dédiée à l'espace Crypto School
 * Affiche les 2 liens School
 */
export function SchoolSidebar({ allLinks }: { allLinks: SerializableGroup[] }) {
  const navigationGroup: NavigationGroup = {
    title: "Crypto School",
    links: SCHOOL_LINKS,
  };

  return (
    <Sidebar variant="inset" suppressHydrationWarning>
      <SidebarHeader className="flex flex-col gap-2">
        <GlobalSearchCommand allLinks={allLinks} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarNavigationMenu link={navigationGroup} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <ContactFeedbackPopover />
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
