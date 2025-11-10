import type {
  NavigationGroup,
  NavigationLink,
} from "@/features/navigation/navigation.type";
import {
  BarChart3,
  Calculator,
  TrendingUp,
  Users,
  Home,
  LineChart,
  PlusCircle,
  Gift,
  GraduationCap,
  FileText,
  Zap,
  Compass,
  Megaphone,
  Clock,
  Link2,
  TrendingUpDown,
} from "lucide-react";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Trading Space Navigation Groups
 *
 * Issue #81 - Réorganisation sidebar Trading avec organisation par intention:
 *
 * Nouvelle structure (5 sections):
 * 1. MY FEED - Dashboard + Following (engagement quotidien)
 * 2. DISCOVER - Signals Feed + Traders Marketplace (découverte)
 * 3. MY TRADING - My Trades + Risk Console + History (outils actifs)
 * 4. PUBLISH - Trader Dashboard + Create Signal + Portfolio + Referral (traders uniquement)
 * 5. INSIGHTS & GROWTH - Analytics + School + Tax + Upgrade (progression)
 */

// Section 1: MY FEED (Engagement quotidien)
const MY_FEED_LINKS: NavigationLink[] = [
  {
    href: "/dashboard",
    Icon: Home,
    label: "Dashboard",
    description: "Your personalized trading dashboard",
  },
  {
    href: "/following",
    Icon: Users,
    label: "Following",
    description: "Manage traders you follow",
  },
];

// Section 2: DISCOVER (Découverte & Consommation)
const DISCOVER_LINKS: NavigationLink[] = [
  {
    href: "/signals",
    Icon: TrendingUp,
    label: "Signals Feed",
    description: "Browse all trading signals",
  },
  {
    href: "/traders",
    Icon: Users,
    label: "Traders Marketplace",
    description: "Discover verified traders",
  },
];

// Section 3: MY TRADING (Outils de trading actifs - PRO/ULTRA)
const MY_TRADING_LINKS: NavigationLink[] = [
  {
    href: "/my-trades",
    Icon: TrendingUpDown,
    label: "My Trades",
    description: "Copy trades, journal, and performance tracking",
    requiresPlan: "PRO",
  },
  {
    href: "/risk-console",
    Icon: Calculator,
    label: "Risk Console",
    description: "Calculate position sizing and manage risk",
    requiresPlan: "PRO",
  },
  {
    href: "/risk-console/history",
    Icon: Clock,
    label: "Risk History",
    description: "View your risk calculation history",
    requiresPlan: "PRO",
  },
];

// Section 4: PUBLISH (Traders uniquement)
const PUBLISH_LINKS: NavigationLink[] = [
  {
    href: "/dashboard/trader",
    Icon: BarChart3,
    label: "Trade Space",
    description: "Your trader stats and signals",
  },
  {
    href: "/dashboard/trader/signals/new",
    Icon: PlusCircle,
    label: "Create Signal",
    description: "Publish a new trading signal",
  },
  {
    href: "/portfolio",
    Icon: LineChart,
    label: "Portfolio",
    description: "Track your trading performance",
  },
  {
    href: "/trader-tools/referral",
    Icon: Gift,
    label: "Referrals",
    description: "Earn rewards by inviting traders",
  },
];

// Section 5: INSIGHTS & GROWTH (Analytics + Learning + Upgrade)
const INSIGHTS_GROWTH_LINKS: NavigationLink[] = [
  {
    href: "/analytics",
    Icon: LineChart,
    label: "Platform Analytics",
    description: "View platform statistics and trends",
  },
  {
    href: "/school/courses",
    Icon: GraduationCap,
    label: "Crypto School",
    description: "Learn crypto trading with interactive courses",
    requiresPlan: "PRO",
  },
  {
    href: "/tax/import",
    Icon: FileText,
    label: "Tax Declaration",
    description: "Import transactions and generate tax reports",
    requiresPlan: "ULTRA",
  },
  {
    href: "/pricing",
    Icon: Zap,
    label: "Upgrade Plan",
    description: "Unlock more features with Pro or Ultra",
    badge: { type: "new" },
  },
];

// CrossLink for PUBLISH section (Connect Exchange)
const CONNECT_EXCHANGE_LINK: NavigationLink = {
  href: "/account/exchanges",
  Icon: Link2,
  label: "Connect Exchange",
  description: "Link your Binance or Bybit account",
  badge: { type: "custom", label: "Setup" },
};

/**
 * Get trading navigation groups
 *
 * @param hasTraderProfile - Whether user has a trader profile (to show PUBLISH section)
 * @param activeSignalsCount - Number of active signals followed (for badge on Dashboard)
 * @param userPlan - Current user plan (to show/hide plan badges)
 * @returns Array of navigation groups with dynamic badges
 */
export function getTradingNavigationGroups(
  hasTraderProfile: boolean,
  activeSignalsCount?: number,
  userPlan?: MyCryptoPilotPlanName,
): NavigationGroup[] {
  // Helper: Add plan badge if user doesn't have access
  const addPlanBadge = (
    link: NavigationLink,
    plan: MyCryptoPilotPlanName | null | undefined,
  ): NavigationLink => {
    if (!link.requiresPlan) return link;

    const requiredPlan = link.requiresPlan;
    const normalizedPlan = (plan ?? "free") as MyCryptoPilotPlanName;

    // Check if user has access
    const hasAccess =
      (requiredPlan === "PRO" &&
        (normalizedPlan === "pro" || normalizedPlan === "ultra")) ||
      (requiredPlan === "ULTRA" && normalizedPlan === "ultra");

    // If user has access, remove badge
    if (hasAccess) {
      return { ...link, badge: undefined };
    }

    // Otherwise, add plan badge
    return {
      ...link,
      badge: { type: "plan", plan: requiredPlan },
    };
  };

  // MY FEED: Add count badge on Dashboard if activeSignalsCount > 0
  const myFeedLinks = MY_FEED_LINKS.map((link) => {
    if (
      link.href === "/dashboard" &&
      activeSignalsCount &&
      activeSignalsCount > 0
    ) {
      return {
        ...link,
        badge: { type: "count" as const, count: activeSignalsCount },
      };
    }
    return link;
  });

  // MY TRADING: Add plan badges
  const myTradingLinks = MY_TRADING_LINKS.map((link) =>
    addPlanBadge(link, userPlan),
  );

  // PUBLISH: Add trader badges
  const publishLinks: NavigationLink[] = PUBLISH_LINKS.map((link) => ({
    ...link,
    badge: { type: "trader" as const },
  }));

  // Add CrossLink at the end (without trader badge)
  publishLinks.push({
    ...CONNECT_EXCHANGE_LINK,
    badge: { type: "custom" as const, label: "Setup" },
  });

  // INSIGHTS & GROWTH: Add plan badges
  const insightsGrowthLinks = INSIGHTS_GROWTH_LINKS.map((link) =>
    addPlanBadge(link, userPlan),
  );

  // Build groups
  const groups: NavigationGroup[] = [
    {
      title: "MY FEED",
      links: myFeedLinks,
      icon: Home,
      defaultOpen: true,
    },
    {
      title: "DISCOVER",
      links: DISCOVER_LINKS,
      icon: Compass,
      defaultOpen: true,
    },
    {
      title: "MY TRADING",
      links: myTradingLinks,
      icon: TrendingUpDown,
      defaultOpen: true,
    },
  ];

  // Conditionally add PUBLISH section
  if (hasTraderProfile) {
    groups.push({
      title: "PUBLISH",
      links: publishLinks,
      icon: Megaphone,
      badge: { type: "trader" },
      defaultOpen: true,
    });
  }

  // INSIGHTS & GROWTH
  groups.push({
    title: "INSIGHTS & GROWTH",
    links: insightsGrowthLinks,
    icon: TrendingUp,
    defaultOpen: false, // Collapsed by default
  });

  return groups;
}

// Legacy export for compatibility (flat list of all links)
export const TRADING_LINKS: NavigationLink[] = [
  ...MY_FEED_LINKS,
  ...DISCOVER_LINKS,
  ...MY_TRADING_LINKS,
  ...PUBLISH_LINKS,
  ...INSIGHTS_GROWTH_LINKS,
];
