import { PrismaClient } from "@prisma/client";
import { stripe } from "./stripe";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      organization: {
        async update({ args, query }) {
          const email = args.data.email;
          const orgId = args.where.id;

          if (!email || typeof email !== "string") {
            return query(args);
          }

          if (!orgId) {
            return query(args);
          }

          const org = await prisma.organization.findUnique({
            where: {
              id: orgId,
            },
          });

          const stripeCustomerId = org?.stripeCustomerId;

          if (!stripeCustomerId) {
            return query(args);
          }

          await stripe.customers.update(stripeCustomerId, {
            email: email,
          });

          return query(args);
        },
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
