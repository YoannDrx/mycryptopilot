import { OrganizationMembershipRole } from "@prisma/client";
import { Home, Settings } from "lucide-react";

type OrganizationLink = {
  href: string;
  icon: React.ComponentType;
  label: string;
  roles?: OrganizationMembershipRole[];
};

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
] satisfies OrganizationLink[];
