import { CircleUser, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrganizationCache } from "@/lib/react/cache";
import { PropsWithChildren } from "react";
import { OrganizationCommand } from "./OrganizationCommand";
import { OrganizationLinks } from "./OrganizationLinks";
import { OrganizationsSelect } from "./OrganizationsSelect";

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
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
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
            <Card x-chunk="dashboard-02-chunk-0">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
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
              <OrganizationsSelect
                currentOrganizationId={organization.id}
                organizations={userOrganizations}
              />
              <OrganizationLinks
                variant="mobile"
                organizationId={organization.id}
                roles={roles}
              />
              <div className="mt-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Upgrade to Pro</CardTitle>
                    <CardDescription>
                      Unlock all features and get unlimited access to our
                      support team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">
                      Upgrade
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <OrganizationCommand />
          </div>
          <UserDropdown>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="size-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </UserDropdown>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
