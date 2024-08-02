import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { NavigationWrapper } from "@/features/navigation/Navigation";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { requiredAuth } from "@/lib/auth/helper";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import type { PageParams } from "@/types/next";
import { OrganizationsSelect } from "../[orgId]/(navigation)/_navigation/OrganizationsSelect";
import { NewOrganizationForm } from "./NewOrganizationForm";

export default async function RoutePage(props: PageParams<{}>) {
  const user = await requiredAuth();
  const userOrgs = await getUsersOrgs();

  return (
    <NavigationWrapper
      logoChildren={
        <OrganizationsSelect
          organizations={userOrgs}
          currentOrganizationId="new"
        >
          <span>Create organization</span>
        </OrganizationsSelect>
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
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Create a new organization</LayoutTitle>
          <LayoutDescription>
            Each organization has its own billing account and can be used to
            manage multiple members.
          </LayoutDescription>
        </LayoutHeader>
        <LayoutContent>
          <NewOrganizationForm />
        </LayoutContent>
      </Layout>
    </NavigationWrapper>
  );
}
