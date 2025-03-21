import { RefreshPage } from "@/components/utils/refresh-page";
import { auth } from "@/lib/auth";
import { orgMetadata } from "@/lib/metadata";
import { getCurrentOrg } from "@/lib/organizations/get-org";
import type { LayoutParams, PageParams } from "@/types/next";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { InjectCurrentOrgStore } from "./use-current-org";

export async function generateMetadata(
  props: PageParams<{ orgSlug: string }>,
): Promise<Metadata> {
  const params = await props.params;
  return orgMetadata(params.orgSlug);
}

export default async function RouteLayout(
  props: LayoutParams<{ orgSlug: string }>,
) {
  const params = await props.params;

  const org = await getCurrentOrg();

  // The user try to go to another organization, we must sync with the URL
  if (org?.slug !== params.orgSlug) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationSlug: params.orgSlug,
      },
    });
    // Make a full refresh of the page
    return <RefreshPage />;
  }

  return (
    <InjectCurrentOrgStore
      org={{
        id: org.id,
        slug: org.slug,
        name: org.name,
        image: org.logo ?? null,
        subscription: org.subscription,
      }}
    >
      {props.children}
    </InjectCurrentOrgStore>
  );
}
