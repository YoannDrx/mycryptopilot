import type { NavigationGroup } from "@/features/navigation/navigation.type";
import type { AuthRole } from "@/lib/auth/auth-permissions";
import { isInRoles } from "@/lib/organizations/is-in-roles";
import type { SerializableGroup } from "./global-search-command";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  DollarSign,
  FileText,
  FileUp,
  GraduationCap,
  Home,
  LineChart,
  Mail,
  MessageSquare,
  TrendingUp,
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

/**
 * Convert NavigationGroup[] to SerializableGroup[] (without icons)
 * for passing to Client Components
 */
export const toSerializableLinks = (
  groups: NavigationGroup[],
): SerializableGroup[] => {
  return groups.map((group) => ({
    title: group.title,
    links: group.links.map((link) => ({
      href: link.href,
      label: link.label,
    })),
  }));
};

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
        label: "My Signals",
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
      {
        href: `${ORGANIZATION_PATH}/portfolio`,
        Icon: LineChart,
        label: "Portfolio Analytics",
      },
    ],
  },
  {
    title: "Crypto School",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/courses`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/courses`,
        Icon: BookOpen,
        label: "Courses",
      },
      {
        href: `${ORGANIZATION_PATH}/progress`,
        Icon: GraduationCap,
        label: "My Progress",
      },
    ],
  },
  {
    title: "Tax & Declaration",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/import`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/import`,
        Icon: FileUp,
        label: "Import Transactions",
      },
      {
        href: `${ORGANIZATION_PATH}/reports`,
        Icon: FileText,
        label: "Tax Reports",
      },
    ],
  },
  {
    title: "Account",
    defaultOpenStartPath: `${ORGANIZATION_PATH}/account`,
    links: [
      {
        href: `${ORGANIZATION_PATH}/account`,
        Icon: User2,
        label: "Profile",
      },
      {
        href: `${ORGANIZATION_PATH}/account/discord`,
        Icon: MessageSquare,
        label: "Discord Integration",
      },
      {
        href: `${ORGANIZATION_PATH}/account/email`,
        Icon: Mail,
        label: "Email Preferences",
      },
      {
        href: `${ORGANIZATION_PATH}/account/following`,
        Icon: Users,
        label: "Manage Following",
      },
      {
        href: `${ORGANIZATION_PATH}/account/danger`,
        Icon: AlertCircle,
        label: "Danger Zone",
      },
    ],
  },
] satisfies NavigationGroup[];
