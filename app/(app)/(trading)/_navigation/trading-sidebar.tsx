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
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarMenuButtonLink } from "@/components/ui/sidebar-utils";
import { ContactFeedbackPopover } from "@/features/contact/feedback/contact-feedback-popover";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import { NavigationBadge } from "@/features/navigation/navigation-badge";
import {
  GlobalSearchCommand,
  type SerializableGroup,
} from "../../_navigation/global-search-command";
import { getTradingNavigationGroups } from "./trading-links";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useSidebarState } from "@/stores/sidebar-state";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Trading Sidebar
 *
 * Issue #81 - Réorganisation sidebar Trading avec organisation par intention:
 *
 * Nouvelle structure (5 sections):
 * - MY FEED: Dashboard + Following (engagement quotidien)
 * - DISCOVER: Signals Feed + Traders Marketplace (découverte)
 * - MY TRADING: My Trades + Risk Console + History (outils actifs)
 * - PUBLISH: Trader Dashboard + Create Signal + Portfolio + Referral (traders uniquement)
 * - INSIGHTS & GROWTH: Analytics + School + Tax + Upgrade (progression)
 *
 * Features:
 * - Badges dynamiques (plan requirements, counts, status)
 * - État des sections persiste dans localStorage (Zustand)
 * - Sections collapsibles
 * - Tooltips sur les badges locked
 */
export function TradingSidebar({
  allLinks,
  hasTraderProfile,
  activeSignalsCount,
  userPlan,
}: {
  allLinks: SerializableGroup[];
  hasTraderProfile: boolean;
  activeSignalsCount?: number;
  userPlan?: MyCryptoPilotPlanName;
}) {
  // Get navigation groups avec données dynamiques
  const navigationGroups = getTradingNavigationGroups(
    hasTraderProfile,
    activeSignalsCount,
    userPlan,
  );

  // Utiliser store Zustand pour persister l'état collapsed/expanded
  const collapsedSections = useSidebarState((state) => state.collapsedSections);
  const toggleSection = useSidebarState((state) => state.toggleSection);
  const hasHydrated = useSidebarState((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      void useSidebarState.persist.rehydrate();
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return <SidebarLoadingState />;
  }

  return (
    <Sidebar variant="inset" suppressHydrationWarning>
      <SidebarHeader className="flex flex-col gap-2">
        <GlobalSearchCommand allLinks={allLinks} />
      </SidebarHeader>
      <SidebarContent suppressHydrationWarning>
        {navigationGroups.map((group) => {
          const isOpen = !collapsedSections[group.title];

          return (
            <Collapsible
              key={group.title}
              open={isOpen}
              onOpenChange={() => toggleSection(group.title)}
              suppressHydrationWarning
            >
              <SidebarGroup suppressHydrationWarning>
                <CollapsibleTrigger className="w-full [&[data-state=open]>div>svg]:rotate-180">
                  <SidebarGroupLabel className="group/label flex w-full cursor-pointer items-center justify-between text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase transition-colors hover:text-[#00ffaa]">
                    <span className="flex items-center gap-2">
                      {group.icon && <group.icon className="h-4 w-4" />}
                      {group.title}
                    </span>
                    <div className="flex items-center gap-1">
                      {group.badge && <NavigationBadge badge={group.badge} />}
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.links.map((item) => {
                        if (item.hidden) return null;

                        return (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButtonLink href={item.href}>
                              <item.Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                              {item.badge && (
                                <NavigationBadge badge={item.badge} />
                              )}
                            </SidebarMenuButtonLink>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <ContactFeedbackPopover />
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function SidebarLoadingState() {
  return (
    <Sidebar variant="inset" collapsible="none">
      <SidebarHeader className="px-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </SidebarHeader>
      <SidebarContent className="gap-4 px-6 py-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
