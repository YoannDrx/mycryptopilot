import { Menu } from "lucide-react";

import { LogoSvg } from "@/components/svg/LogoSvg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrganizationCache } from "@/lib/react/cache";
import { PropsWithChildren } from "react";
import { OrganizationCommand } from "./OrganizationCommand";
import { OrganizationLinks } from "./OrganizationLinks";
import { OrganizationsSelect } from "./OrganizationsSelect";
import { UpgradeCard } from "./UpgradeCard";

export async function OrganizationNavigation({ children }: PropsWithChildren) {
  const { organization, user, roles } =
    await getRequiredCurrentOrganizationCache();
  const userOrganizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center gap-2 border-b px-4 lg:h-[60px] lg:px-6">
            <LogoSvg size={32} />
            <OrganizationsSelect
              currentOrganizationId={organization.id}
              organizations={userOrganizations}
            />
          </div>
          <div className="flex-1">
            <OrganizationLinks
              variant="default"
              organizationId={organization.id}
              roles={roles}
            />
          </div>
          <div className="mt-auto p-4">
            <UpgradeCard />
          </div>
        </div>
      </div>
      <div className="flex max-h-screen flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="size-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center gap-2">
                <LogoSvg size={32} />
                <OrganizationsSelect
                  currentOrganizationId={organization.id}
                  organizations={userOrganizations}
                />
              </div>
              <OrganizationLinks
                variant="mobile"
                organizationId={organization.id}
                roles={roles}
              />
              <div className="mt-auto">
                <UpgradeCard />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <OrganizationCommand />
          </div>
          <UserDropdown>
            <Button variant="ghost" className="size-10 rounded-full" size="sm">
              <Avatar className="size-8">
                <AvatarFallback>
                  {user.email ? user.email.slice(0, 2) : "??"}
                </AvatarFallback>
                {user.image && <AvatarImage src={user.image} />}
              </Avatar>
            </Button>
          </UserDropdown>
        </header>
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
