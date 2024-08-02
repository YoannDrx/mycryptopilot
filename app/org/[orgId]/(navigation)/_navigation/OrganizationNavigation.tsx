import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { NavigationWrapper } from "@/features/navigation/Navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrganizationCache } from "@/lib/react/cache";
import { PropsWithChildren } from "react";
import { OrganizationCommand } from "./OrganizationCommand";
import { NavigationLinks } from "./OrganizationLinks";
import { OrganizationsSelect } from "./OrganizationsSelect";
import { UpgradeCard } from "./UpgradeCard";

export async function OrganizationNavigation({ children }: PropsWithChildren) {
  const {
    org: organization,
    user,
    roles,
  } = await getRequiredCurrentOrganizationCache();
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
    <NavigationWrapper
      logoChildren={
        <OrganizationsSelect
          currentOrganizationId={organization.id}
          organizations={userOrganizations}
        />
      }
      navigationChildren={
        <NavigationLinks
          links="organization"
          variant="default"
          organizationId={organization.id}
          roles={roles}
        />
      }
      bottomNavigationChildren={<UpgradeCard />}
      topBarCornerLeftChildren={
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
      }
      topBarChildren={<OrganizationCommand />}
    >
      {children}
    </NavigationWrapper>
  );
}
