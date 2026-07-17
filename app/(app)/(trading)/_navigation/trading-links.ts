import type {
  NavigationGroup,
  NavigationLink,
} from "@/features/navigation/navigation.type";
import { Briefcase, Calculator, TrendingUp, User, Users } from "lucide-react";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

export const TRADING_LINKS: NavigationLink[] = [
  {
    href: "/risk-console",
    Icon: Calculator,
    label: "Risk Console",
    description: "Simulate position sizing and risk",
  },
  {
    href: "/signals",
    Icon: TrendingUp,
    label: "Signals",
    description: "Review testnet signals",
  },
  {
    href: "/portfolio",
    Icon: Briefcase,
    label: "Portfolio read-only",
    description: "Inspect balances without trading permissions",
  },
  {
    href: "/traders",
    Icon: Users,
    label: "Traders",
    description: "Review sourced trader profiles",
  },
  {
    href: "/account",
    Icon: User,
    label: "Account",
    description: "Manage read-only exchange connections",
  },
];

export function getTradingNavigationGroups(
  _hasTraderProfile: boolean,
  _activeSignalsCount?: number,
  _userPlan?: MyCryptoPilotPlanName,
): NavigationGroup[] {
  return [
    {
      title: "DEMO / TESTNET",
      links: TRADING_LINKS,
      defaultOpen: true,
    },
  ];
}
