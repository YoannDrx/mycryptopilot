import LoggedInNavigationWrapper from "@/features/navigation/LogInNavigationWrapper";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { NewOrganizationForm } from "./NewOrgForm";

export default async function RoutePage() {
  return (
    <LoggedInNavigationWrapper>
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
    </LoggedInNavigationWrapper>
  );
}
