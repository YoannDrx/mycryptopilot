import AuthNavigationWrapper from "@/features/navigation/LogInNavigationWrapper";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { createSearchParamsMessageUrl } from "@/features/searchparams-message/createSearchParamsMessageUrl";
import { SiteConfig } from "@/site-config";
import { redirect } from "next/navigation";
import { NewOrganizationForm } from "./NewOrgForm";

export default async function RoutePage() {
  if (SiteConfig.features.enableSingleMemberOrg) {
    redirect(
      createSearchParamsMessageUrl(`/org`, {
        type: "message",
        message: "You can't create an organization.",
      }),
    );
  }

  return (
    <AuthNavigationWrapper>
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
    </AuthNavigationWrapper>
  );
}
