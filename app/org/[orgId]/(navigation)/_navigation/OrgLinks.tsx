"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { isInRoles } from "@/lib/organizations/isInRoles";
import { OrganizationMembershipRole } from "@prisma/client";
import { usePathname } from "next/navigation";
import { ACCOUNT_LINKS } from "../../../../(logged-in)/(account-layout)/account-links";
import { ORGANIZATION_LINKS } from "./navigation.links";

export type NavigationLink = {
  href: string;
  icon: React.ComponentType;
  label: string;
  roles?: OrganizationMembershipRole[];
};

const useCurrentPath = (links: { href: string }[], organizationId?: string) => {
  const currentPath = usePathname()
    .replace(`:organizationId`, organizationId ?? "")
    .split("/")
    .filter(Boolean);

  const linkMatchCounts = links.map((link) => {
    return {
      url: link.href,
      matchCount: link.href
        .split("/")
        .filter(Boolean)
        .filter((segment, index) => segment === currentPath[index]).length,
    };
  });

  const mostMatchingLink = linkMatchCounts.reduce(
    (maxMatchLink, currentLink) =>
      currentLink.matchCount > maxMatchLink.matchCount
        ? currentLink
        : maxMatchLink,
    { url: "", matchCount: 0 },
  );

  return mostMatchingLink.url || links[0].href;
};

const NavigationLinkMapping = {
  organization: ORGANIZATION_LINKS,
  account: ACCOUNT_LINKS,
} as const;

type NavigationLinkMappingKey = keyof typeof NavigationLinkMapping;

export function NavigationLinks({
  variant,
  organizationId,
  roles: userRoles,
  links: linksKey,
}: {
  variant?: "default" | "mobile";
  organizationId?: string;
  roles?: OrganizationMembershipRole[];
  links: NavigationLinkMappingKey;
}) {
  const baseLinks = NavigationLinkMapping[linksKey];

  const currentPath = useCurrentPath(baseLinks, organizationId);
  // filter links by roles
  const links = userRoles
    ? baseLinks.filter((link) =>
        link.roles ? isInRoles(userRoles, link.roles) : true,
      )
    : baseLinks;

  if (variant === "mobile") {
    return (
      <nav className="grid gap-2 text-lg font-medium">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href.replaceAll(":organizationId", organizationId ?? "")}
            className={cn(
              `mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2`,
              {
                "text-primary hover:text-primary": currentPath === link.href,
                "text-muted-foreground hover:text-foreground":
                  currentPath !== link.href,
              },
            )}
          >
            <link.icon className="size-5" />
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href.replaceAll(":organizationId", organizationId ?? "")}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2`, {
            "text-primary hover:text-primary": currentPath === link.href,
            "text-muted-foreground hover:text-foreground":
              currentPath !== link.href,
          })}
        >
          <link.icon className="size-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
