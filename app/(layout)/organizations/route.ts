import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { NextResponse } from "next/server";

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
    return NextResponse.redirect(`${getServerUrl()}/organizations/new`);
  }

  return NextResponse.redirect(`${getServerUrl()}/${organization.id}`);
};
