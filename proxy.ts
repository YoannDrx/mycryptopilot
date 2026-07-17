import { isMyCryptoPilotPathEnabled } from "@/config/product-features";
import {
  handleRootRedirect,
  isAdminRoute,
  redirectToRoot,
  validateAdminAccess,
} from "@/lib/auth/middleware-utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Product and access boundary for the Next.js application.
 * Hidden demonstrator modules redirect to the Risk Console before rendering.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isMyCryptoPilotPathEnabled(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/risk-console";
    url.searchParams.set("notice", "demo-only");
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  if (isAdminRoute(pathname)) {
    const adminUser = await validateAdminAccess(request);
    if (!adminUser) return redirectToRoot(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
