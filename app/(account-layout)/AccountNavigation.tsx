import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { requiredAuth } from "@/lib/auth/helper";
import { prisma } from "@/lib/prisma";
import { PropsWithChildren } from "react";
import { NavigationWrapper } from "../../src/features/navigation/Navigation";
import { NavigationLinks } from "../org/[orgId]/(navigation)/_navigation/OrganizationLinks";
import { OrganizationsSelect } from "../org/[orgId]/(navigation)/_navigation/OrganizationsSelect";

export async function AccountNavigation({ children }: PropsWithChildren) {
  const user = await requiredAuth();
  const userOrganizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
  });
  return (
    <NavigationWrapper
      logoChildren={
        <OrganizationsSelect organizations={userOrganizations}>
          <Avatar className="size-8">
            <AvatarFallback>
              {user.email ? user.email.slice(0, 2) : "??"}
            </AvatarFallback>
            {user.image && <AvatarImage src={user.image} />}
          </Avatar>
          <span>{user.name}</span>
        </OrganizationsSelect>
      }
      navigationChildren={<NavigationLinks links="account" variant="default" />}
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
    >
      {children}
    </NavigationWrapper>
  );
}
