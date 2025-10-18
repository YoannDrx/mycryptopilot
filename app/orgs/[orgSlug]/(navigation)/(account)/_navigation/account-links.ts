import type { NavigationLink } from "@/features/navigation/navigation.type";
import { User2, MessageSquare, Mail, Users, AlertCircle } from "lucide-react";

const ORGANIZATION_PATH = `/orgs/:organizationSlug`;

/**
 * Account Space Links
 *
 * 5 liens pour la section Account Settings :
 * - Profile (settings principal)
 * - Discord Integration
 * - Email Preferences
 * - Following (traders suivis)
 * - Danger Zone (suppression compte)
 */
export const ACCOUNT_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/account`,
    Icon: User2,
    label: "Profile",
  },
  {
    href: `${ORGANIZATION_PATH}/account/discord`,
    Icon: MessageSquare,
    label: "Discord Integration",
  },
  {
    href: `${ORGANIZATION_PATH}/account/email`,
    Icon: Mail,
    label: "Email Preferences",
  },
  {
    href: `${ORGANIZATION_PATH}/account/following`,
    Icon: Users,
    label: "Manage Following",
  },
  {
    href: `${ORGANIZATION_PATH}/account/danger`,
    Icon: AlertCircle,
    label: "Danger Zone",
  },
];
