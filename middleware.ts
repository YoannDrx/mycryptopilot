import {
  handleRootRedirect,
  isAdminRoute,
  redirectToRoot,
  validateAdminAccess,
} from "@/lib/auth/middleware-utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware - Big Bang (Issue #77 Phase 3)
 *
 * Simplified middleware without organization switching logic:
 * - Root redirect
 * - Admin route protection
 * - No organization validation (user-centric architecture)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirect
  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  // Admin route protection
  if (isAdminRoute(pathname)) {
    const adminUser = await validateAdminAccess(request);
    if (!adminUser) {
      return redirectToRoot(request);
    }
    return NextResponse.next();
  }

  // No organization logic needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};
