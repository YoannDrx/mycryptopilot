import type { User } from "@prisma/client";
import { unauthorized } from "next/navigation";
import { baseAuth } from "./auth";

export class AuthError extends Error {}

export const auth = async () => {
  const session = await baseAuth();

  if (session?.user) {
    const user = session.user as User;
    return user;
  }

  return null;
};

export const requiredAuth = async () => {
  const user = await auth();

  if (!user) {
    unauthorized();
  }

  return user;
};
