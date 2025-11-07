import { unauthorized } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionWithHeaders } from "./get-session";

export const getSession = async () => {
  const sessionHeaders = await headers();
  return getSessionWithHeaders(sessionHeaders);
};

export const getUser = async () => {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  // Fetch additional user fields from database (planName, planExpiresAt, userSubscription, etc.)
  // Better Auth session only contains basic fields
  // Big Bang (Issue #77 Phase 4): Include userSubscription for user-centric architecture
  const fullUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      role: true,
      discordId: true,
      planName: true,
      planExpiresAt: true,
      createdAt: true,
      updatedAt: true,
      userSubscription: true,
    },
  });

  if (!fullUser) {
    return null;
  }

  return fullUser;
};

export const getRequiredUser = async () => {
  const user = await getUser();

  if (!user) {
    unauthorized();
  }

  return user;
};

export const getRequiredAdmin = async () => {
  const user = await getRequiredUser();

  if (user.role !== "admin") {
    unauthorized();
  }

  return user;
};
