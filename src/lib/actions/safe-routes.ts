// app/api/hello/route.ts
import { createSafeRoute } from "next-safe-route";
import { NextResponse } from "next/server";
import { auth } from "../auth/helper";
import { getRequiredCurrentOrg } from "../organizations/getOrg";

export class RouteError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export const route = createSafeRoute({
  handleServerError: (e: Error) => {
    if (e instanceof RouteError) {
      return NextResponse.json(
        { message: e.message, status: e.status },
        {
          status: e.status,
        },
      );
    }

    return NextResponse.json({ message: e.message }, { status: 500 });
  },
});

export const authRoute = route.use(async () => {
  const user = await auth();

  if (!user) {
    throw new RouteError("Session not found!");
  }

  return {
    user,
  };
});

// Can only be used in /api/organizations/[organizationId]/* routes !
export const orgRoute = authRoute.use(async () => {
  try {
    const organization = await getRequiredCurrentOrg();

    if (!organization) {
      throw new Error("Organization not found!");
    }

    return {
      organization,
    };
  } catch (e) {
    throw new RouteError(
      "You need to be part of an organization to access this resource.",
    );
  }
});
