import { SiteConfig } from "@/site-config";
import { Home, Settings, User } from "lucide-react";
import { NavigationLink } from "./OrgLinks";

const orgPath = `/orgs/:organizationSlug`;

export const ORGANIZATION_LINKS = [
  {
    href: orgPath,
    icon: Home,
    label: "Dashboard",
  },
  {
    href: `${orgPath}/users`,
    icon: User,
    label: "Users",
  },
  {
    href: SiteConfig.features.enableSingleMemberOrg
      ? "/account"
      : `${orgPath}/settings`,
    icon: Settings,
    label: "Settings",
    roles: ["ADMIN"],
  },
] satisfies NavigationLink[];
