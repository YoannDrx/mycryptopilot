import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { requiredAuth } from "@/lib/auth/helper";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import { PropsWithChildren } from "react";
import { NavigationWrapper } from "../../src/features/navigation/NavigationWrapper";
import { NavigationLinks } from "../org/[orgId]/(navigation)/_navigation/OrgLinks";
import { OrgsSelect } from "../org/[orgId]/(navigation)/_navigation/OrgsSelect";

export async function AccountNavigation({ children }: PropsWithChildren) {
  const user = await requiredAuth();
  const userOrgs = await getUsersOrgs();
  return (
    <NavigationWrapper
      logoChildren={
        <OrgsSelect orgs={userOrgs}>
          <Avatar className="size-8">
            <AvatarFallback>
              {user.email ? user.email.slice(0, 2) : "??"}
            </AvatarFallback>
            {user.image && <AvatarImage src={user.image} />}
          </Avatar>
          <span>{user.name}</span>
        </OrgsSelect>
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
