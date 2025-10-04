import type { NavigationGroup } from "@/features/navigation/navigation.type";
import type { AuthRole } from "@/lib/auth/auth-permissions";
import { isInRoles } from "@/lib/organizations/is-in-roles";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  Settings,
  TrendingUp,
  TriangleAlert,
  User,
  User2,
  Users,
} from "lucide-react";

const replaceSlug = (href: string, slug: string): string =>
  href.replace(":organizationSlug", slug);

export const getOrganizationNavigation = (
  slug: string,
  userRoles: AuthRole[] | undefined,
): NavigationGroup[] => {
  return ORGANIZATION_LINKS.reduce<NavigationGroup[]>((acc, group) => {
    const filteredLinks = group.links
      .filter((link) => !link.roles || isInRoles(userRoles, link.roles))
      .map((link) => ({
        ...link,
        href: replaceSlug(link.href, slug),
      }));

    if (filteredLinks.length === 0) return acc;

    acc.push({
      ...group,
      defaultOpenStartPath: group.defaultOpenStartPath
        ? replaceSlug(group.defaultOpenStartPath, slug)
        : undefined,
      links: filteredLinks,
    });

    return acc;
  }, []);
};

const ORGANIZATION_PATH = `/orgs/:organizationSlug`;

export const ORGANIZATION_LINKS: NavigationGroup[] = [
  {
    title: "Menu",
    links: [
      {
        href: ORGANIZATION_PATH,
        Icon: Home,
        label: "Dashboard",
      },
      {
        href: `${ORGANIZATION_PATH}/dashboard`,
        Icon: BarChart3,
        label: "Trading Dashboard",
      },
      {
        href: `${ORGANIZATION_PATH}/traders`,
        Icon: Users,
        label: "Traders Marketplace",
      },
      {
        href: `${ORGANIZATION_PATH}/pricing`,
        Icon: DollarSign,
        label: "Pricing",
      },
      {
        href: `${ORGANIZATION_PATH}/users`,
        Icon: User,
        label: "Users",
      },
    ],
  },
  {
    title: "Trader",
    links: [
      {
        href: `${ORGANIZATION_PATH}/dashboard/trader`,
        Icon: TrendingUp,
        label: "Trader Dashboard",
      },
    ],
  },
  {
    title: "Account",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/settings`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/settings`,
        Icon: Settings,
        label: "Settings",
        roles: ["admin"],
      },
      {
        href: `${ORGANIZATION_PATH}/settings/members`,
        Icon: User2,
        label: "Members",
        roles: ["admin"],
      },
      {
        href: `${ORGANIZATION_PATH}/settings/billing`,
        Icon: CreditCard,
        label: "Billing",
        roles: ["admin"],
      },
      {
        href: `${ORGANIZATION_PATH}/settings/danger`,
        Icon: TriangleAlert,
        label: "Danger Zone",
        roles: ["owner"],
      },
    ],
  },
] satisfies NavigationGroup[];
