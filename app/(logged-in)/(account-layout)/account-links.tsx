import { AlertCircle, Mail, User2 } from "lucide-react";
import { NavigationLink } from "../../org/[orgId]/(navigation)/_navigation/OrgLinks";

export const ACCOUNT_LINKS: NavigationLink[] = [
  {
    href: "/account",
    icon: User2,
    label: "Profile",
  },
  {
    href: "/account/email",
    icon: Mail,
    label: "Mail",
  },
  {
    href: "/account/danger",
    icon: AlertCircle,
    label: "Danger",
  },
];
