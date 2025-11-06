import type { NavigationLink } from "@/features/navigation/navigation.type";
import {
  User2,
  MessageSquare,
  Mail,
  Users,
  AlertCircle,
  BarChart3,
  Receipt,
} from "lucide-react";

/**
 * Account Space Links
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed /orgs/:organizationSlug prefix
 * - Direct URLs (no slug replacement needed)
 *
 * 7 liens pour la section Account Settings :
 * - Profile (settings principal)
 * - Discord Integration
 * - Portfolio Tracking (Binance/Bybit connections)
 * - Payment History (crypto payments history)
 * - Email Preferences
 * - Following (traders suivis)
 * - Danger Zone (suppression compte)
 */
export const ACCOUNT_LINKS: NavigationLink[] = [
  {
    href: "/account",
    Icon: User2,
    label: "Profile",
  },
  {
    href: "/account/discord",
    Icon: MessageSquare,
    label: "Discord Integration",
  },
  {
    href: "/account/exchanges",
    Icon: BarChart3,
    label: "Portfolio Tracking",
  },
  {
    href: "/account/payments",
    Icon: Receipt,
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
    Icon: AlertCircle,
    label: "Danger Zone",
  },
];
