import { RefreshPageOrganization } from "@/components/utils/refresh-organization";
import { auth } from "@/lib/auth";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { orgMetadata } from "@/lib/metadata";
import { getCurrentOrg } from "@/lib/organizations/get-org";
import { prisma } from "@/lib/prisma";
import type { LayoutParams, PageParams } from "@/types/next";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { OrgList } from "./(navigation)/_navigation/org-list";
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
    const user = await getRequiredUser();
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          {
            slug: params.orgSlug,
          },
          {
            id: params.orgSlug,
          },
        ],
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    // If we can't find the organization, we must show the org list
    if (!org) {
      return <OrgList />;
    }

    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationId: org.id,
      },
    });

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
