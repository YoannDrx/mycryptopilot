"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { isInRoles } from "@/lib/organizations/isInRoles";
import { OrganizationMembershipRole } from "@prisma/client";
import { usePathname } from "next/navigation";
import { ORGANIZATION_LINKS } from "./navigation.links";

const useCurrentPath = (links: { href: string }[], organizationId: string) => {
  const currentPath = usePathname()
    .replace(`/${organizationId}`, "/")
    .split("/")
    .filter(Boolean);
  console.log({ currentPath, links });

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

export function OrganizationLinks({
  variant,
  organizationId,
  roles,
}: {
  variant?: "default" | "mobile";
  organizationId: string;
  roles?: OrganizationMembershipRole[];
}) {
  const currentPath = useCurrentPath(ORGANIZATION_LINKS, organizationId);
  // filter links by roles
  const links = roles
    ? ORGANIZATION_LINKS.filter((link) =>
        link.roles ? isInRoles(roles, link.roles) : true,
      )
    : ORGANIZATION_LINKS;

  if (variant === "mobile") {
    return (
      <nav className="grid gap-2 text-lg font-medium">
        {links.map((link, index) => (
          <Link
            key={index}
            href={`/${organizationId}/${link.href}`}
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
          href={`/${organizationId}/${link.href}`}
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
