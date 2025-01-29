"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SiteConfig } from "@/site-config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

type OrganizationsSelectProps = {
  currentOrgSlug?: string;
  children?: ReactNode;
  orgs: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
  }[];
};

export const OrgsSelect = (props: OrganizationsSelectProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const org = props.orgs.find((org) => org.slug === props.currentOrgSlug);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton variant="outline">
              {org ? (
                <span className="inline-flex w-full items-center gap-2">
                  <Avatar className="size-6 object-contain">
                    <AvatarFallback>
                      {org.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                    {org.image ? <AvatarImage src={org.image} /> : null}
                  </Avatar>
                  <span className="line-clamp-1 text-left">{org.name}</span>
                </span>
              ) : (
                <span>Open organization</span>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
            {props.orgs
              .filter((org) => org.slug !== props.currentOrgSlug)
              .map((org) => {
                if (typeof window === "undefined") return null;

                const href = props.currentOrgSlug
                  ? pathname.replace(
                      `/orgs/${props.currentOrgSlug}`,
                      `/orgs/${org.slug}`,
                    )
                  : `/orgs/${org.slug}`;

                return (
                  <DropdownMenuItem key={org.slug} asChild>
                    <Link
                      href={href}
                      key={org.slug}
                      className="inline-flex w-full items-center gap-2"
                    >
                      <Avatar className="size-6">
                        <AvatarFallback>
                          {org.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                        {org.image ? <AvatarImage src={org.image} /> : null}
                      </Avatar>
                      <span className="line-clamp-1 text-left">{href}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            {!SiteConfig.features.enableSingleMemberOrg ? (
              <DropdownMenuItem
                onClick={() => {
                  router.push("/orgs/new");
                }}
              >
                Add a new organization
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
