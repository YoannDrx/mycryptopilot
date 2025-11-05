import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardTitle } from "@/components/ui/card";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import {
  listOrganizationsApi,
  setActiveOrganizationApi,
} from "@/lib/auth/auth-api-helper";
import { redirect } from "next/navigation";
import { OrgAutoSelect } from "./org-auto-select";

/**
 * This component is used to display the list of organizations the user has access to.
 * It is used to avoid unsynced state between the "active organization" and the URL.
 * @returns null
 */
export const OrgList = async () => {
  const orgs = await listOrganizationsApi();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Your organizations</LayoutTitle>
        <LayoutDescription>
          Choose an organization to continue
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent className="flex flex-col gap-2">
        <OrgAutoSelect orgs={orgs.map((o) => ({ slug: o.slug ?? "" }))} />
        {orgs.map((org) => (
          <form key={org.id} className="w-full">
            <button
              className="bg-card w-full rounded-md border p-4 hover:cursor-pointer"
              key={org.id}
              formAction={async () => {
                "use server";
                await setActiveOrganizationApi(org.id);
                redirect(`/orgs/${org.slug}`);
              }}
            >
              <div className="flex flex-row items-center gap-2">
                <Avatar>
                  {org.logo ? <AvatarImage src={org.logo} /> : null}
                  <AvatarFallback>{org.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <CardTitle>{org.name}</CardTitle>
              </div>
            </button>
          </form>
        ))}
      </LayoutContent>
    </Layout>
  );
};
