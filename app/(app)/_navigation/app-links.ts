import type {
  NavigationGroup,
  NavigationLink,
} from "@/features/navigation/navigation.type";
import { Briefcase, Calculator, TrendingUp, User, Users } from "lucide-react";

export const APP_LINKS: NavigationLink[] = [
  { href: "/risk-console", Icon: Calculator, label: "Risk Console" },
  { href: "/signals", Icon: TrendingUp, label: "Signals" },
  { href: "/portfolio", Icon: Briefcase, label: "Portfolio read-only" },
  { href: "/traders", Icon: Users, label: "Traders" },
  { href: "/account", Icon: User, label: "Account" },
];

export function getAppNavigationGroups(
  _hasTraderProfile: boolean,
): NavigationGroup[] {
  return [{ title: "DEMO / TESTNET", links: APP_LINKS }];
}
