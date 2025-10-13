import type { NavigationGroup } from "@/features/navigation/navigation.type";
import type { AuthRole } from "@/lib/auth/auth-permissions";
import { isInRoles } from "@/lib/organizations/is-in-roles";
import {
  BarChart3,
  BookOpen,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  TrendingUp,
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
    title: "Home",
    links: [
      {
        href: ORGANIZATION_PATH,
        Icon: Home,
        label: "Dashboard",
      },
    ],
  },
  {
    title: "Trading",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/dashboard`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/dashboard`,
        Icon: BarChart3,
        label: "My Trading Dashboard",
      },
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
        href: `${ORGANIZATION_PATH}/pricing`,
        Icon: DollarSign,
        label: "Pricing & Plans",
      },
      {
        href: `${ORGANIZATION_PATH}/dashboard/trader`,
        Icon: TrendingUp,
        label: "Trader Dashboard",
      },
    ],
  },
  {
    title: "Crypto School",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/school/courses`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/school/courses`,
        Icon: BookOpen,
        label: "Courses",
      },
      {
        href: `${ORGANIZATION_PATH}/school/progress`,
        Icon: GraduationCap,
        label: "My Progress",
      },
    ],
  },
  {
    title: "Tax & Declaration",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/tax/import`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/tax/import`,
        Icon: FileText,
        label: "Import Transactions",
      },
      {
        href: `${ORGANIZATION_PATH}/tax/reports`,
        Icon: FileText,
        label: "Tax Reports",
      },
    ],
  },
] satisfies NavigationGroup[];
