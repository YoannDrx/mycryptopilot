import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { NextResponse } from "next/server";

/**
 * If a user arrive to `/org` we redirect them to the first organization they are part of.
 *
 * 💡 If you want to redirect user to organization page, redirect them to `/org`
 * 💡 If you want them to redirect to a specific organization, redirect them to `/org/orgId`
 */
export const GET = async () => {
  const user = await auth();

  if (!user) {
    return NextResponse.redirect(`${getServerUrl()}/auth/signin`);
  }

  const organization = await prisma.organization.findFirst({
    where: {
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

  if (!organization) {
    return NextResponse.redirect(`${getServerUrl()}/org/new`);
  }

  return NextResponse.redirect(`${getServerUrl()}/org/${organization.id}`);
};
