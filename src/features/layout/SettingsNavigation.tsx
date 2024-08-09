"use client";

import { useMatchingPathname } from "@/hooks/useMatchingPathname";
import { isInRoles } from "@/lib/organizations/isInRoles";
import { OrganizationMembershipRole } from "@prisma/client";
import { motion } from "framer-motion";
import Link from "next/link";

type SettingLink = {
  href: string;
  label: string;
  roles?: OrganizationMembershipRole[];
};

type SettingsNavigationProps = {
  links: SettingLink[];
  roles: OrganizationMembershipRole[];
};

export const SettingsNavigation = (props: SettingsNavigationProps) => {
  const matchingLink = useMatchingPathname(props.links.map((l) => l.href));

  return (
    <div className="flex gap-2 lg:flex-col" style={{ minWidth: 150 }}>
      {props.links.map((link) => {
        const isMatching = link.href === matchingLink;

        if (!isInRoles(props.roles, link.roles)) {
          return null;
        }

        return (
          <div key={link.href} className="relative w-full">
            {isMatching && (
              <motion.div
                className="absolute inset-0 rounded-md bg-accent/50"
                layoutId="settings-link-list"
              />
            )}
            <Link
              className="relative inline-block w-full rounded-md border border-transparent p-2.5 text-sm text-foreground transition-all duration-75 hover:border-accent/50"
              href={link.href}
            >
              {link.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
};
