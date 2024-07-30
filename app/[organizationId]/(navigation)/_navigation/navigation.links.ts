import { Home, Settings } from "lucide-react";
import { NavigationLink } from "./OrganizationLinks";

export const ORGANIZATION_LINKS = [
  {
    href: "/:organizationId/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/:organizationId/settings",
    icon: Settings,
    label: "Settings",
    roles: ["OWNER", "ADMIN"],
  },
] satisfies NavigationLink[];
