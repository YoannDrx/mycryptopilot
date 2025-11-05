import { createZodRoute } from "next-zod-route";
import { NextResponse } from "next/server";
import { getUser } from "./auth/auth-user";
import { ApplicationError } from "./errors/application-error";
import { ZodRouteError } from "./errors/zod-route-error";
import { logger } from "./logger";

/**
 * Base route handler with automatic error handling and validation
 *
 * @example
 * ```ts
 * export const POST = route
 *   .params(z.object({ id: z.string() }))
 *   .body(z.object({ name: z.string() }))
 *   .handler(async (req, { params, body }) => {
 *     return { success: true };
 *   });
 * ```
 */
export const route = createZodRoute({
  handleServerError: (e: Error) => {
    if (e instanceof ZodRouteError) {
      logger.debug("[DEV] - ZodRouteError", e);
      return NextResponse.json(
        { message: e.message },
        {
          status: e.status,
        },
      );
    }

    if (e instanceof ApplicationError) {
      logger.debug("[DEV] - ApplicationError", e);
      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    logger.info("Unknown Error", e);

    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ message: e.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  },
});

/**
 * Route handler with authentication middleware
 * Ensures user is logged in before accessing the route
 */
export const authRoute = route.use(async ({ next }) => {
  const user = await getUser();

  if (!user) {
    throw new ZodRouteError("Session not found!", 401);
  }

  return next({
    ctx: { user },
  });
});

/**
 * DEPRECATED: orgRoute removed - Big Bang (Issue #77 Phase 10)
 *
 * Organization-based routes are no longer needed in user-centric architecture.
 * All routes should use either:
 * - `route` for public routes
 * - `authRoute` for authenticated user routes
 *
 * Legacy usages have been migrated to authRoute.
 */
