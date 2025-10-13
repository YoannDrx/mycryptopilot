import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { NewOrganizationForm } from "./new-org-form";

export default async function RoutePage() {
  await getRequiredUser();

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Create a new organization</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <NewOrganizationForm />
      </LayoutContent>
    </Layout>
  );
}
