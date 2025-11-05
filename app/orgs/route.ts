import { setActiveOrganizationApi } from "@/lib/auth/auth-api-helper";
import { getUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { NextResponse } from "next/server";

/**
 * If a user arrive to `/orgs` we redirect them to the first organization they are part of.
 *
 * 💡 If you want to redirect user to organization page, redirect them to `/orgs`
 * 💡 If you want them to redirect to a specific organization, redirect them to `/orgs/orgSlug`
 */
export const GET = async () => {
  const user = await getUser();

  if (!user) {
    return NextResponse.redirect(`${getServerUrl()}/auth/signin`);
  }

  const member = await prisma.member.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      organization: {
        select: {
          slug: true,
          id: true,
        },
      },
    },
  });

  if (!member?.organization.id) {
    return NextResponse.redirect(`${getServerUrl()}/orgs/new`);
  }

  // Set The active organization in the session
  await setActiveOrganizationApi(member.organization.id);

  return NextResponse.redirect(
    `${getServerUrl()}/orgs/${member.organization.slug}`,
  );
};
