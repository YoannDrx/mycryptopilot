import { prisma } from "@/lib/prisma";

export const getOrgsMembers = (orgId: string) => {
  return prisma.organizationMembership.findMany({
    where: {
      organizationId: orgId,
    },
    select: {
      user: {
        select: {
          image: true,
          id: true,
          name: true,
          email: true,
        },
      },
      id: true,
      role: true,
    },
  });
};
