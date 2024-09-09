import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/features/auth/UserDropdown";
import { ContactFeedbackPopover } from "@/features/contact/feedback/ContactFeedbackPopover";
import { NavigationWrapper } from "@/features/navigation/NavigationWrapper";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
import { PropsWithChildren } from "react";
import { OrganizationCommand } from "./OrgCommand";
import { NavigationLinks } from "./OrgLinks";
import { OrgsSelect } from "./OrgsSelect";
import { UpgradeCard } from "./UpgradeCard";

export async function OrgNavigation({ children }: PropsWithChildren) {
  const { org, user, roles } = await getRequiredCurrentOrgCache();

  const userOrganizations = await getUsersOrgs();

  return (
    <NavigationWrapper
      logoChildren={
        <OrgsSelect currentOrgSlug={org.slug} orgs={userOrganizations} />
      }
      navigationChildren={
        <NavigationLinks
          links="organization"
          variant="default"
          organizationSlug={org.slug}
          roles={roles}
        />
      }
      bottomNavigationChildren={<UpgradeCard />}
      topBarCornerLeftChildren={
        <>
          <ContactFeedbackPopover>
            <Button size="sm" variant="outline">
              Feedback
            </Button>
          </ContactFeedbackPopover>
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
        </>
      }
      topBarChildren={<OrganizationCommand />}
    >
      {children}
    </NavigationWrapper>
  );
}
