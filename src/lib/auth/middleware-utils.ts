import { getSessionApi } from "@/lib/auth/auth-api-helper";
import { SiteConfig } from "@/site-config";
import { logger } from "@/lib/logger";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware Utils - Big Bang (Issue #77 Phase 3)
 *
 * Simplified utilities without organization logic:
 * - Root redirect to /dashboard (not /orgs)
 * - Admin route validation
 * - No org slug extraction, no org switching
 */

export const handleRootRedirect = (request: NextRequest) => {
  if (!SiteConfig.features.enableLandingRedirection) return null;

  try {
    const session = getSessionCookie(request, {
      cookiePrefix: SiteConfig.appId,
    });

    if (!session) return null;

    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  } catch (error) {
    // Si erreur parsing cookie (corrompu ou invalide), ne pas bloquer
    logger.error("Error in handleRootRedirect:", error);
    return null;
  }
};

export const validateAdminAccess = async (request: NextRequest) => {
  try {
    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: SiteConfig.appId,
    });

    if (!sessionCookie) return null;

    const session = await getSessionApi(request.headers);

    if (!session?.user) return null;
    if (session.user.role !== "admin") return null;

    return session.user;
  } catch (error) {
    // Si erreur validation admin (session invalide, etc.)
    logger.error("Error in validateAdminAccess:", error);
    return null;
  }
};

export const redirectToRoot = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
};

export const isAdminRoute = (pathname: string) => {
  return pathname.startsWith("/admin");
};

// Organization-related functions removed - Big Bang (Issue #77 Phase 3)
// - isReservedSlug (no org slugs)
// - handleLegacyOrgRedirect (no legacy redirects needed)
