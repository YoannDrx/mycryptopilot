import { RefreshPageOrganization } from "@/components/utils/refresh-organization";
import { auth } from "@/lib/auth";
import { orgMetadata } from "@/lib/metadata";
import { getCurrentOrg } from "@/lib/organizations/get-org";
import { prisma } from "@/lib/prisma";
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

  const org = await getCurrentOrg({ currentOrgSlug: params.orgSlug });

  // The user try to go to another organization, we must sync with the URL
  if (org?.slug !== params.orgSlug) {
    const isId = await prisma.organization.findUnique({
      where: {
        id: params.orgSlug,
      },
      select: {
        slug: true,
        id: true,
      },
    });

    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationSlug: isId ? undefined : params.orgSlug,
        organizationId: isId ? params.orgSlug : undefined,
      },
    });

    // Force to always have the slug inside the URL
    return <RefreshPageOrganization />;
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
