import { OrganizationMembershipRole } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "../auth/helper";
import { logger } from "../logger";
import { prisma } from "../prisma";

const getOrganizationIdFromUrl = () => {
  const headerList = headers();
  const xURL = headerList.get("x-url");

  if (!xURL) {
    return null;
  }

  // get the parameters after /o/ or /organizations/ at the beginning of the url
  const match = xURL.match(/\/(?:org|organizations)\/([^/]+)/);
  logger.debug({ match });
  if (!match) {
    return null;
  }

  const organizationId = match[1];

  if (!organizationId) {
    return null;
  }

  return organizationId;
};

export const getCurrentOrganization = async (
  roles?: OrganizationMembershipRole[],
) => {
  const user = await auth();

  if (!user) {
    return null;
  }

  const organizationId = getOrganizationIdFromUrl();

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

export const getRequiredCurrentOrganization = async (
  roles?: OrganizationMembershipRole[],
) => {
  const result = await getCurrentOrganization(roles);

  if (!result) {
    throw new Error("No organization found");
  }

  return result;
};
