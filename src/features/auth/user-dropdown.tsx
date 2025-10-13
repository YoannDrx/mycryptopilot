"use client";

import { Typography } from "@/components/nowts/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth-client";
import {
  BarChart3,
  BookOpen,
  FileText,
  Monitor,
  Moon,
  Shield,
  SunMedium,
  SunMoon,
  User2,
} from "lucide-react";

import { useCurrentOrg } from "@app/orgs/[orgSlug]/use-current-org";
import { useTheme } from "next-themes";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { UserDropdownLogout } from "./user-dropdown-logout";
import { UserDropdownStopImpersonating } from "./user-dropdown-stop-impersonating";

export const UserDropdown = ({ children }: PropsWithChildren) => {
  const session = useSession();
  const theme = useTheme();
  const currentOrg = useCurrentOrg();

  if (!session.data?.user) {
    return null;
  }

  // Build base path with orgSlug if available
  const basePath = currentOrg?.slug ? `/orgs/${currentOrg.slug}` : "/orgs";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          {session.data.user.name ? (
            <>
              <Typography variant="small">
                {session.data.user.name || session.data.user.email}
              </Typography>
              <Typography variant="muted">{session.data.user.email}</Typography>
            </>
          ) : (
            <Typography variant="small">{session.data.user.email}</Typography>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${basePath}/dashboard`}>
            <BarChart3 className="mr-2 size-4" />
            Trading
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${basePath}/courses`}>
            <BookOpen className="mr-2 size-4" />
            Crypto School
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${basePath}/import`}>
            <FileText className="mr-2 size-4" />
            Tax & Declaration
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${basePath}/account`}>
            <User2 className="mr-2 size-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        {session.data.user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 size-4" />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon className="text-muted-foreground mr-4 size-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => theme.setTheme("dark")}>
                <SunMedium className="mr-2 size-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => theme.setTheme("light")}>
                <Moon className="mr-2 size-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => theme.setTheme("system")}>
                <Monitor className="mr-2 size-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <UserDropdownLogout />
          {session.data.session.impersonatedBy ? (
            <UserDropdownStopImpersonating />
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
