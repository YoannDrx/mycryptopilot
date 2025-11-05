import type {
  NavigationGroup,
  NavigationLink,
} from "@/features/navigation/navigation.type";
import {
  BarChart3,
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  Home,
  LineChart,
  PlusCircle,
  UserCheck,
  Gift,
  Settings,
} from "lucide-react";

/**
 * App Navigation Links (Root-Level Routes)
 *
 * Navigation pour les nouvelles routes racine (Phase 5a)
 * Compatible avec le système dual-mode
 *
 * Routes migrées:
 * - /dashboard (au lieu de /orgs/:slug)
 * - /signals (au lieu de /orgs/:slug/signals)
 * - /traders (au lieu de /orgs/:slug/traders)
 * - /pricing (au lieu de /orgs/:slug/pricing)
 * - /account (au lieu de /orgs/:slug/account)
 *
 * Sub-routes restent temporairement sous /orgs/:slug/ avec redirections 307
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
    href: "/dashboard",
    Icon: UserCheck,
    label: "My Signals",
  },
];

// Section 3: TRADER TOOLS (traders uniquement)
const TRADER_TOOLS_LINKS: NavigationLink[] = [
  {
    href: "/orgs/:organizationSlug/dashboard/trader", // Pas encore migré
    Icon: BarChart3,
    label: "Trader Dashboard",
  },
  {
    href: "/orgs/:organizationSlug/portfolio", // Pas encore migré
    Icon: LineChart,
    label: "Portfolio Analytics",
  },
  {
    href: "/orgs/:organizationSlug/dashboard/trader/signals/new", // Pas encore migré
    Icon: PlusCircle,
    label: "Create Signal",
  },
  {
    href: "/orgs/:organizationSlug/trader-tools/referral", // Pas encore migré
    Icon: Gift,
    label: "Referral Program",
  },
];

// Section 4: ANALYTICS
const ANALYTICS_LINKS: NavigationLink[] = [
  {
    href: "/orgs/:organizationSlug/analytics", // Pas encore migré
    Icon: LineChart,
    label: "Platform Analytics",
  },
];

// Section 5: SETTINGS
const SETTINGS_LINKS: NavigationLink[] = [
  {
    href: "/pricing",
    Icon: DollarSign,
    label: "Pricing & Plans",
  },
  {
    href: "/account",
    Icon: Settings,
    label: "Account Settings",
  },
];

/**
 * Get app navigation groups
 * @param hasTraderProfile - Whether user has a trader profile (to show TRADER TOOLS section)
 */
export function getAppNavigationGroups(
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

// Flat list of all links for compatibility
export const APP_LINKS: NavigationLink[] = [
  ...OVERVIEW_LINKS,
  ...SIGNALS_LINKS,
  ...TRADER_TOOLS_LINKS,
  ...ANALYTICS_LINKS,
  ...SETTINGS_LINKS,
];
