import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { createSearchParamsMessageUrl } from "@/features/searchparams-message/createSearchParamsMessageUrl";
import { requiredAuth } from "@/lib/auth/helper";
import { SiteConfig } from "@/site-config";
import { redirect } from "next/navigation";
import { AccountNavigation } from "../../(logged-in)/(account-layout)/account-navigation";
import { NewOrganizationForm } from "./new-org-form";

export default async function RoutePage() {
  await requiredAuth();

  if (SiteConfig.features.enableSingleMemberOrg) {
    redirect(
      createSearchParamsMessageUrl(`/orgs`, {
        type: "message",
        message: "You can't create an organization.",
      }),
    );
  }

  return (
    <AccountNavigation emailVerified={true}>
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Create a new organization</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <NewOrganizationForm />
        </LayoutContent>
      </Layout>
    </AccountNavigation>
  );
}
