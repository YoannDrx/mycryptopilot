import { Button } from "@/components/ui/button";
import { requiredAuth } from "@/lib/auth/helper";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { PropsWithChildren } from "react";
import { OrgsSelect } from "../../../app/org/[orgId]/(navigation)/_navigation/OrgsSelect";
import { UserDropdown } from "../auth/UserDropdown";
import { NavigationWrapper } from "./NavigationWrapper";

export default async function LoggedInNavigationWrapper(
  props: PropsWithChildren,
) {
  const user = await requiredAuth();
  const userOrgs = await getUsersOrgs();

  return (
    <NavigationWrapper
      logoChildren={
        <OrgsSelect orgs={userOrgs} currentOrgId="new">
          <span>Create organization</span>
        </OrgsSelect>
      }
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
      {props.children}
    </NavigationWrapper>
  );
}
