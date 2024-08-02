import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { requiredAuth } from "@/lib/auth/helper";
import type { PageParams } from "@/types/next";
import { redirect } from "next/navigation";
import { NewOrganizationForm } from "./NewOrganizationForm";

export default async function RoutePage(props: PageParams<{}>) {
  const callbackUrl = props.searchParams.callbackUrl;
  if (callbackUrl) {
    redirect(String(callbackUrl));
  }

  await requiredAuth();

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>
          Just one little step before starting your journey
        </LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <NewOrganizationForm />
      </LayoutContent>
    </Layout>
  );
}
