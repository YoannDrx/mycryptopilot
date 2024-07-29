import { Home, Settings } from "lucide-react";
import { NavigationLink } from "./OrganizationLinks";

export const ORGANIZATION_LINKS = [
  {
    href: "/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    roles: ["OWNER", "ADMIN"],
  },
] satisfies NavigationLink[];
