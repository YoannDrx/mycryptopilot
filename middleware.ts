import {
  extractOrgSlug,
  findUserOrganization,
  handleRootRedirect,
  handleLegacyOrgRedirect,
  isAdminRoute,
  isReservedSlug,
  redirectToOrgList,
  redirectToRoot,
  switchActiveOrganization,
  validateAdminAccess,
  validateSession,
} from "@/lib/auth/middleware-utils";
import { FEATURES } from "@/lib/feature-flags";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirect (applies in both modes)
  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  // Admin route protection (applies in both modes)
  if (isAdminRoute(pathname)) {
    const adminUser = await validateAdminAccess(request);
    if (!adminUser) {
      return redirectToRoot(request);
    }
    return NextResponse.next();
  }

  // ============================================
  // DUAL-MODE: Organization switching vs Legacy redirects
  // ============================================
  if (FEATURES.USER_ACCOUNT_MODE) {
    // ============================================
    // MODE NOUVEAU: Legacy URL redirects only
    // ============================================
    // Handle 307 redirects for old /orgs/{slug}/* URLs
    const legacyRedirect = handleLegacyOrgRedirect(request);
    if (legacyRedirect) {
      return legacyRedirect;
    }

    // No organization switching needed in new mode
    return NextResponse.next();
  } else {
    // ============================================
    // MODE LEGACY: Organization switching logic
    // ============================================
    const slug = extractOrgSlug(pathname);
    if (!slug) return NextResponse.next();

    if (isReservedSlug(slug)) {
      return NextResponse.next();
    }

    const sessionData = await validateSession(request);
    if (!sessionData) return NextResponse.next();

    const { session, activeOrganisation } = sessionData;

    if (activeOrganisation?.slug === slug) {
      return NextResponse.next();
    }

    const org = await findUserOrganization(slug, session.session.userId);

    if (!org) {
      return redirectToOrgList(request);
    }

    return switchActiveOrganization(request, org.id);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};
