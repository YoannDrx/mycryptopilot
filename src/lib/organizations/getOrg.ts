import { OrganizationMembershipRole } from "@prisma/client";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "../auth/helper";
import { prisma } from "../prisma";

const getOrgIdFromUrl = () => {
  const headerList = headers();
  const xURL = headerList.get("x-url");

  if (!xURL) {
    return null;
  }

  // get the parameters after /o/ or /organizations/ at the beginning of the url
  const match = xURL.match(/\/(?:org|organizations)\/([^/]+)/);

  if (!match) {
    return null;
  }

  const organizationId = match[1];

  if (!organizationId) {
    return null;
  }

  return organizationId;
};

export const getCurrentOrg = async (roles?: OrganizationMembershipRole[]) => {
  const user = await auth();

  if (!user) {
    return null;
  }

  const organizationId = getOrgIdFromUrl();

  if (!organizationId) {
    return null;
  }

  const org = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      members: {
        some: {
          userId: user.id,
          role: roles
            ? {
                in: [...roles, "OWNER"],
              }
            : undefined,
        },
      },
    },
    select: {
      id: true,
      name: true,
      plan: true,
      email: true,
      stripeCustomerId: true,
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!org) {
    return null;
  }

  return {
    org,
    user,
    roles: org.members.map((m) => m.role),
  };
};

export const getRequiredCurrentOrg = async (
  roles?: OrganizationMembershipRole[],
) => {
  const result = await getCurrentOrg(roles);

  if (!result) {
    notFound();
  }

  return result;
};
