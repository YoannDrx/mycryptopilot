import { AlertCircle, Mail, User2 } from "lucide-react";
import { NavigationLink } from "../org/[orgId]/(navigation)/_navigation/OrganizationLinks";

export const ACCOUNT_LINKS: NavigationLink[] = [
  {
    href: "/account",
    icon: User2,
    label: "Profile",
  },
  {
    href: "/account/email",
    icon: Mail,
    label: "Settings",
  },
  {
    href: "/account/danger",
    icon: AlertCircle,
    label: "Danger",
  },
];
