import { orgMetadata } from "@/lib/metadata";
import { getCurrentOrgCache } from "@/lib/react/cache";
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
  const org = await getCurrentOrgCache();
  return (
    <InjectCurrentOrgStore
      org={
        org?.org
          ? {
              id: org.org.id,
              name: org.org.name,
              image: org.org.image,
              plan: org.org.plan,
            }
          : undefined
      }
    >
      {props.children}
    </InjectCurrentOrgStore>
  );
}
