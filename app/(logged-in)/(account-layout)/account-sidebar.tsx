"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarMenuButtonLink } from "@/components/ui/sidebar-utils";
import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import { ChevronDown } from "lucide-react";
import { OrgsSelect } from "../../orgs/[orgSlug]/(navigation)/_navigation/orgs-select";
import { getAccountNavigation } from "./account.links";

export function AccountSidebar({
  userOrgs,
}: {
  userOrgs: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
  }[];
}) {
  const links: NavigationGroup[] = getAccountNavigation();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <OrgsSelect orgs={userOrgs} />
      </SidebarHeader>
      <SidebarContent>
        {links.map((link) => (
          <SidebarGroup key={link.title}>
            <SidebarGroupLabel>
              {link.title}
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {link.links.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButtonLink href={item.href}>
                      <item.Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButtonLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
