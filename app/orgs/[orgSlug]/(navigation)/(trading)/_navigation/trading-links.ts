import type {
  NavigationGroup,
  NavigationLink,
} from "@/features/navigation/navigation.type";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Home,
  LineChart,
  PlusCircle,
  UserCheck,
  Gift,
} from "lucide-react";

const ORGANIZATION_PATH = `/orgs/:organizationSlug`;

/**
 * Trading Space Navigation Groups
 *
 * Organized into 4 sections:
 * 1. OVERVIEW - Dashboard général
 * 2. SIGNALS - Consumption de signaux (tous les users)
 * 3. TRADER TOOLS - Publication de signaux (traders uniquement)
 * 4. ANALYTICS - Statistiques plateforme
 */

// Section 1: OVERVIEW
const OVERVIEW_LINKS: NavigationLink[] = [
  {
    href: ORGANIZATION_PATH,
    Icon: Home,
    label: "Dashboard",
  },
];

// Section 2: SIGNALS (tous les utilisateurs)
const SIGNALS_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/signals`,
    Icon: TrendingUp,
    label: "Signals Feed",
  },
  {
    href: `${ORGANIZATION_PATH}/traders`,
    Icon: Users,
    label: "Traders Marketplace",
  },
  {
    href: `${ORGANIZATION_PATH}/dashboard`,
    Icon: UserCheck,
    label: "My Signals",
  },
];

// Section 3: TRADER TOOLS (traders uniquement)
const TRADER_TOOLS_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/dashboard/trader`,
    Icon: BarChart3,
    label: "Trader Dashboard",
  },
  {
    href: `${ORGANIZATION_PATH}/dashboard/trader/signals/new`,
    Icon: PlusCircle,
    label: "Create Signal",
  },
  {
    href: `${ORGANIZATION_PATH}/trader-tools/referral`,
    Icon: Gift,
    label: "Referral Program",
  },
];

// Section 4: ANALYTICS
const ANALYTICS_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/analytics`,
    Icon: LineChart,
    label: "Platform Analytics",
  },
];

// Section 5: SETTINGS (footer)
const SETTINGS_LINKS: NavigationLink[] = [
  {
    href: `${ORGANIZATION_PATH}/pricing`,
    Icon: DollarSign,
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
