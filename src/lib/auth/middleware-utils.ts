import {
  getFullOrganizationApiWithHeaders,
  getSessionApi,
  setActiveOrganizationApi,
} from "@/lib/auth/auth-api-helper";
import { RESERVED_SLUGS } from "@/lib/organizations/reserved-slugs";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import { FEATURES } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const handleRootRedirect = (request: NextRequest) => {
  if (!SiteConfig.features.enableLandingRedirection) return null;

  try {
    const session = getSessionCookie(request, {
      cookiePrefix: SiteConfig.appId,
    });

    if (!session) return null;

    const url = request.nextUrl.clone();
    url.pathname = "/orgs";
    return NextResponse.redirect(url);
  } catch (error) {
    // Si erreur parsing cookie (corrompu ou invalide), ne pas bloquer
    logger.error("Error in handleRootRedirect:", error);
    return null;
  }
};

export const extractOrgSlug = (pathname: string) => {
  if (!pathname.startsWith("/orgs/")) return null;

  const slugStartIndex = "/orgs/".length;
  const slashIndex = pathname.indexOf("/", slugStartIndex);
  const slug =
    slashIndex === -1
      ? pathname.substring(slugStartIndex)
      : pathname.substring(slugStartIndex, slashIndex);

  const isValidSlug = slug && slug !== "" && pathname !== "/orgs";
  return isValidSlug ? slug : null;
};

export const validateSession = async (request: NextRequest) => {
  try {
    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: SiteConfig.appId,
    });

    if (!sessionCookie) return null;

    const [session, activeOrganisation] = await Promise.all([
      getSessionApi(request.headers),
      getFullOrganizationApiWithHeaders(request.headers),
    ]);

    if (!session?.session.userId) return null;

    return { session, activeOrganisation };
  } catch (error) {
    // Si erreur validation session (session invalide, org inexistante, etc.)
    logger.error("Error in validateSession:", error);
    return null;
  }
};

export const findUserOrganization = async (slug: string, userId: string) => {
  try {
    const org = await prisma.organization.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        members: {
          some: { userId },
        },
      },
      select: { id: true },
    });

    return org;
  } catch (error) {
    // Si erreur DB (connexion, timeout, etc.)
    logger.error("Error in findUserOrganization:", error);
    return null;
  }
};

export const switchActiveOrganization = async (
  request: NextRequest,
  organizationId: string,
) => {
  try {
    await setActiveOrganizationApi(organizationId);

    return NextResponse.redirect(request.url);
  } catch (error) {
    // Si erreur switch org (org inexistante, session invalide, etc.)
    logger.error("Error in switchActiveOrganization:", error);
    // Fallback: rediriger vers /orgs
    const url = request.nextUrl.clone();
    url.pathname = "/orgs";
    return NextResponse.redirect(url);
  }
};

export const redirectToOrgList = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/orgs";
  return NextResponse.redirect(url);
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

export const isReservedSlug = (slug: string) => {
  return RESERVED_SLUGS.includes(slug);
};

/**
 * Handle legacy /orgs/{slug}/* redirects to new routes
 *
 * Only active when FEATURES.USER_ACCOUNT_MODE = true AND FEATURES.LEGACY_ORG_REDIRECTS = true
 * Returns 307 temporary redirect (preserves POST data, signals temporary change to search engines)
 *
 * @example
 * /orgs/abc123/dashboard → /dashboard (307)
 * /orgs/abc123/traders?filter=verified → /traders?filter=verified (307)
 */
export const handleLegacyOrgRedirect = (
  request: NextRequest,
): NextResponse | null => {
  // Only redirect in new mode with redirects enabled
  if (!FEATURES.USER_ACCOUNT_MODE || !FEATURES.LEGACY_ORG_REDIRECTS) {
    return null;
  }

  const { pathname, search } = request.nextUrl;

  // Check if this is a legacy org URL
  if (!pathname.startsWith("/orgs/")) {
    return null;
  }

  const slug = extractOrgSlug(pathname);
  if (!slug) {
    return null;
  }

  // Extract the path after /orgs/{slug}
  const orgPrefix = `/orgs/${slug}`;
  if (!pathname.startsWith(orgPrefix)) {
    return null;
  }

  // Build new path without /orgs/{slug} prefix
  const newPath = pathname.slice(orgPrefix.length) || "/dashboard"; // Default to /dashboard if empty
  const url = request.nextUrl.clone();
  url.pathname = newPath;
  url.search = search; // Preserve query params

  logger.info(
    `[LEGACY REDIRECT] 307 redirect: ${pathname}${search} → ${newPath}${search}`,
  );

  // 307 Temporary Redirect (preserves HTTP method + signals temporary to search engines)
  return NextResponse.redirect(url, { status: 307 });
};
