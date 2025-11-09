import type {
  NavigationGroup,
  NavigationLink,
} from "@/features/navigation/navigation.type";
import {
  BarChart3,
  Calculator,
  TrendingUp,
  Users,
  CreditCard,
  Home,
  LineChart,
  PlusCircle,
  Gift,
} from "lucide-react";

/**
 * Trading Space Navigation Groups
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed /orgs/:organizationSlug prefix
 * - Direct URLs (no slug replacement needed)
 *
 * Organized into 5 sections:
 * 1. OVERVIEW - Dashboard général
 * 2. SIGNALS - Consumption de signaux (tous les users)
 * 3. TRADER TOOLS - Publication de signaux (traders uniquement)
 * 4. ANALYTICS - Statistiques plateforme
 * 5. SETTINGS - Pricing & Plans
 */

// Section 1: OVERVIEW
const OVERVIEW_LINKS: NavigationLink[] = [
  {
    href: "/dashboard",
    Icon: Home,
    label: "Dashboard",
  },
];

// Section 2: SIGNALS (tous les utilisateurs)
const SIGNALS_LINKS: NavigationLink[] = [
  {
    href: "/signals",
    Icon: TrendingUp,
    label: "Signals Feed",
  },
  {
    href: "/risk-console",
    Icon: Calculator,
    label: "Risk Console",
  },
  {
    href: "/traders",
    Icon: Users,
    label: "Traders Marketplace",
  },
  {
    href: "/following",
    Icon: Users,
    label: "Following",
  },
];

// Section 3: TRADER TOOLS (traders uniquement)
const TRADER_TOOLS_LINKS: NavigationLink[] = [
  {
    href: "/dashboard/trader",
    Icon: BarChart3,
    label: "Trader Dashboard",
  },
  {
    href: "/dashboard/trader/signals/new",
    Icon: PlusCircle,
    label: "Create Signal",
  },
  {
    href: "/portfolio",
    Icon: LineChart,
    label: "Portfolio Analytics",
  },
  {
    href: "/trader-tools/referral",
    Icon: Gift,
    label: "Referral Program",
  },
];

// Section 4: ANALYTICS
const ANALYTICS_LINKS: NavigationLink[] = [
  {
    href: "/analytics",
    Icon: LineChart,
    label: "Platform Analytics",
  },
];

// Section 5: SETTINGS
const SETTINGS_LINKS: NavigationLink[] = [
  {
    href: "/pricing",
    Icon: CreditCard,
    label: "Pricing & Plans",
  },
];

/**
 * Get trading navigation groups
 * @param hasTraderProfile - Whether user has a trader profile (to show TRADER TOOLS section)
 */
export function getTradingNavigationGroups(
  hasTraderProfile: boolean,
): NavigationGroup[] {
  const groups: NavigationGroup[] = [
    {
      title: "OVERVIEW",
      links: OVERVIEW_LINKS,
    },
    {
      title: "SIGNALS",
      links: SIGNALS_LINKS,
    },
  ];

  // Conditionally add TRADER TOOLS section
  if (hasTraderProfile) {
    groups.push({
      title: "TRADER TOOLS",
      links: TRADER_TOOLS_LINKS,
    });
  }

  groups.push(
    {
      title: "ANALYTICS",
      links: ANALYTICS_LINKS,
    },
    {
      title: "SETTINGS",
      links: SETTINGS_LINKS,
    },
  );

  return groups;
}

// Legacy export for compatibility (flat list of all links)
export const TRADING_LINKS: NavigationLink[] = [
  ...OVERVIEW_LINKS,
  ...SIGNALS_LINKS,
  ...TRADER_TOOLS_LINKS,
  ...ANALYTICS_LINKS,
  ...SETTINGS_LINKS,
];
