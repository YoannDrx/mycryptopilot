import { SiteConfig } from "@/site-config";
import { Home, Settings, User } from "lucide-react";
import { NavigationLink } from "./OrgLinks";

export const ORGANIZATION_LINKS = [
  {
    href: "/org/:organizationSlug/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/org/:organizationSlug/users",
    icon: User,
    label: "Users",
  },
  {
    href: SiteConfig.features.enableSingleMemberOrg
      ? "/account"
      : "/org/:organizationSlug/settings",
    icon: Settings,
    label: "Settings",
    roles: ["ADMIN"],
  },
] satisfies NavigationLink[];
