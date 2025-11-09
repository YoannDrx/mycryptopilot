import { auth } from "@/lib/auth";

/**
 * Minimal helper around Better Auth session API.
 * Accepts explicit headers so it can be used in both
 * App Router server components and middleware.
 */
export async function getSessionWithHeaders(headers: Headers) {
  return auth.api.getSession({
    headers,
  });
}
