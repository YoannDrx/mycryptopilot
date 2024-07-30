import { AlertCircle, Mail, User2 } from "lucide-react";
import { NavigationLink } from "../[organizationId]/(navigation)/_navigation/OrganizationLinks";

export const ACCOUNT_LINKS: NavigationLink[] = [
  {
    href: "/account",
    icon: User2,
    label: "Profile",
  },
  {
    href: "/account/delete",
    icon: AlertCircle,
    label: "Delete profile",
  },
  {
    href: "/account/email",
    icon: Mail,
    label: "Settings",
  },
];
