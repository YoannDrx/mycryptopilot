import { SiteConfig } from "@/site-config";
import { PrismaClient } from "@prisma/client";
import {
  onOrganizationUpdate,
  onUserUpdateSyncWithOrganization,
} from "./prisma.extends";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      organization: {
        update: onOrganizationUpdate,
      },
      user: {
        update: SiteConfig.features.enableSingleMemberOrg
          ? onUserUpdateSyncWithOrganization
          : undefined,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
