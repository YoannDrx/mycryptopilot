import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const getOrgsMembers = async (orgId: string) => {
  return prisma.member.findMany({
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
      userId: true,
    },
  });
};

export type OrgMembers = Prisma.PromiseReturnType<typeof getOrgsMembers>;
