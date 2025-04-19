import { auth } from "@/lib/auth";
import { RESERVED_SLUGS } from "@/lib/organizations/reserved-slugs";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import { unstable_cache as cache } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (admin path)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|admin).*)",
  ],
  runtime: "nodejs",
};

const extractOrgId = (path: string) => {
  const match = path.match(/^\/orgs\/([^/]+)/);
  return match ? match[1] : null;
};

const INCLUDED_ROUTES = ["/orgs", "/api/orgs"];
const EXCLUDED_ROUTES = RESERVED_SLUGS.map((slug) => `/orgs/${slug}`);

const isOrganizationRoute = (path: string) => {
  return (
    INCLUDED_ROUTES.some((route) => path.startsWith(route)) &&
    !EXCLUDED_ROUTES.some((route) => path.startsWith(route))
  );
};

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (
    SiteConfig.features.enableLandingRedirection &&
    session &&
    request.nextUrl.pathname === "/"
  ) {
    // return NextResponse.redirect(new URL("/orgs", request.url));
  }

  /**
   * This ensure that the current organization is always set correctly
   * It's also avoid to have unauthorized user accessing a organization page
   * You STILL need to check permissions on the routing level
   */
  if (isOrganizationRoute(request.nextUrl.pathname)) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.next();
    }

    const orgSlug = extractOrgId(request.nextUrl.pathname);

    if (!orgSlug) {
      return NextResponse.next();
    }

    const activeOrg = session.session.activeOrganizationId;

    const org = await getOrg(orgSlug, session.session.userId);

    if (!org) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }

    // Everything is already synchronized
    if (org.id === activeOrg) {
      return NextResponse.next();
    }

    const isMember = org.members.length > 0;

    if (!isMember) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }

    await auth.api.setActiveOrganization({
      headers: request.headers,
      body: {
        organizationId: org.id,
      },
    });

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Avoid query the database for each request
const getOrg = cache(
  async (orgSlug: string, userId: string) => {
    return prisma.organization.findFirst({
      where: {
        OR: [{ id: orgSlug }, { slug: orgSlug }],
      },
      select: {
        id: true,
        members: {
          where: {
            userId,
          },
        },
      },
    });
  },
  ["get-org-middleware"],
  {
    revalidate: 60 * 60 * 24, // 24 hours
  },
);
