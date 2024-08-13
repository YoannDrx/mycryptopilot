import { Prisma } from "@prisma/client";
import {
  DefaultArgs,
  DynamicQueryExtensionCb,
  InternalArgs,
} from "@prisma/client/runtime/library";
import { prisma } from "./prisma";
import { stripe } from "./stripe";

export const onOrganizationUpdate: DynamicQueryExtensionCb<
  Prisma.TypeMap<InternalArgs & DefaultArgs, Prisma.PrismaClientOptions>,
  "model",
  "Organization",
  "update"
> = async ({ args, query }) => {
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
};

export const onUserUpdateSyncWithOrganization: DynamicQueryExtensionCb<
  Prisma.TypeMap<InternalArgs & DefaultArgs, Prisma.PrismaClientOptions>,
  "model",
  "User",
  "update"
> = async ({ args, query }) => {
  const userId = args.where.id;

  if (!userId) {
    return query(args);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      organizations: {
        where: {
          roles: {
            hasSome: ["OWNER"],
          },
        },
        select: {
          organization: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const firstOrg = user?.organizations[0].organization;

  console.log({ firstOrg });
  if (!firstOrg?.id) {
    return query(args);
  }

  const emailUpdate = args.data.email ? String(args.data.email) : undefined;
  const nameUpdate = args.data.name
    ? `${String(args.data.name)}'s app`
    : undefined;
  const imageUpdate = args.data.image ? String(args.data.image) : undefined;

  await prisma.organization.update({
    where: {
      id: firstOrg.id,
    },
    data: {
      email: emailUpdate,
      name: nameUpdate,
      image: imageUpdate,
    },
  });

  return query(args);
};
