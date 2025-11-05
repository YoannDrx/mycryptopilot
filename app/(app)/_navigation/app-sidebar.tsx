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
 * App Sidebar (User-Centric)
 * Big Bang (Issue #77 Phase 7) - Simplified user-centric sidebar
 *
 * Changes from org-based sidebar:
 * - No OrgsSelect (single user account)
 * - No GlobalSearchCommand (simplified)
 * - Direct URLs (no slug replacement)
 * - User-centric navigation
 */
export function AppSidebar({
  hasTraderProfile,
}: {
  hasTraderProfile: boolean;
}) {
  // Get navigation groups with conditional TRADER TOOLS section
  const navigationGroups = getAppNavigationGroups(hasTraderProfile);

  // State for collapsible sections (all open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(navigationGroups.map((g) => [g.title, true])),
  );

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar variant="inset" suppressHydrationWarning>
      <SidebarHeader className="flex flex-col gap-2">
        {/* Simplified header - no org select, no global search */}
      </SidebarHeader>
      <SidebarContent suppressHydrationWarning>
        {navigationGroups.map((group) => (
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
