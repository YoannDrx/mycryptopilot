import { Home, Settings } from "lucide-react";
import { NavigationLink } from "./OrgLinks";

export const ORGANIZATION_LINKS = [
  {
    href: "/org/:organizationId/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/org/:organizationId/settings",
    icon: Settings,
    label: "Settings",
    roles: ["OWNER", "ADMIN"],
  },
] satisfies NavigationLink[];
