import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { requiredAuth } from "@/lib/auth/helper";
import { PropsWithChildren } from "react";
import { NavigationLinks } from "../[organizationId]/(navigation)/_navigation/OrganizationLinks";
import { NavigationWrapper } from "../_navigation/Navigation";

export async function AccountNavigation({ children }: PropsWithChildren) {
  const user = await requiredAuth();
  return (
    <NavigationWrapper
      logoChildren={
        <Button variant="ghost">
          <Avatar className="size-8">
            <AvatarFallback>
              {user.email ? user.email.slice(0, 2) : "??"}
            </AvatarFallback>
            {user.image && <AvatarImage src={user.image} />}
          </Avatar>
          {user.name}
        </Button>
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
