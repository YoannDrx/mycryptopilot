import type { NavigationLink } from "@/features/navigation/navigation.type";
import {
  Settings,
  MessageCircle,
  Mail,
  Users,
  Shield,
  Link as LinkIcon,
  CreditCard,
} from "lucide-react";

/**
 * Account Space Links
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed /orgs/:organizationSlug prefix
 * - Direct URLs (no slug replacement needed)
 *
 * 7 liens pour la section Account Settings :
 * - Account Settings (settings principal)
 * - Discord Integration
 * - Exchange Connections (Binance/Bybit connections)
 * - Payment History (crypto payments history)
 * - Email Preferences
 * - Following (traders suivis)
 * - Danger Zone (suppression compte)
 */
export const ACCOUNT_LINKS: NavigationLink[] = [
  {
    href: "/account",
    Icon: Settings,
    label: "Account Settings",
  },
  {
    href: "/account/discord",
    Icon: MessageCircle,
    label: "Discord Integration",
  },
  {
    href: "/account/exchanges",
    Icon: LinkIcon,
    label: "Exchange Connections",
  },
  {
    href: "/account/payments",
    Icon: CreditCard,
    label: "Payment History",
  },
  {
    href: "/account/email",
    Icon: Mail,
    label: "Email Preferences",
  },
  {
    href: "/account/following",
    Icon: Users,
    label: "Following",
  },
  {
    href: "/account/danger",
    Icon: Shield,
    label: "Danger Zone",
  },
];
