import { orgMetadata } from "@/lib/metadata";
import { getCurrentOrg } from "@/lib/organizations/get-org";
import type { LayoutParams, PageParams } from "@/types/next";
import type { Metadata } from "next";
import { unauthorized } from "next/navigation";
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

  const org = await getCurrentOrg({ currentOrgSlug: params.orgSlug });

  if (!org) unauthorized();

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
