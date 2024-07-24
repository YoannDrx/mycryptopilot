import { OrganizationMembershipRole } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "../auth/helper";
import { prisma } from "../prisma";

export const getCurrentOrganization = async (
  roles?: OrganizationMembershipRole[],
) => {
  const user = await auth();

  if (!user) {
    return null;
  }

  const headerList = headers();
  const xURL = headerList.get("x-url");
  console.log({ xURL });

  if (!xURL) {
    return null;
  }

  // get the first parameter of the url
  const [, , , organizationId] = xURL.split("/");

  const organization = await prisma.organization.findFirst({
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

  if (!organization) {
    return null;
  }

  return {
    organization,
    user,
    roles: organization.members.map((m) => m.role),
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
