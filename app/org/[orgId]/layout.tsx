import { orgMetadata } from "@/lib/metadata";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import type { LayoutParams, PageParams } from "@/types/next";
import { Metadata } from "next";
import { InjectCurrentOrgStore } from "./useCurrentOrg";

export async function generateMetadata({
  params,
}: PageParams<{ orgId: string }>): Promise<Metadata> {
  return orgMetadata(params.orgId);
}

export default async function RouteLayout(
  props: LayoutParams<{ orgId: string }>,
) {
  const { org } = await getRequiredCurrentOrgCache();
  return (
    <InjectCurrentOrgStore org={org}>{props.children}</InjectCurrentOrgStore>
  );
}
