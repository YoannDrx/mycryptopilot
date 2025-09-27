"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth/auth-user";

export const getUserAccountsAction = async () => {
  const user = await getRequiredUser();

  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return accounts;
};
