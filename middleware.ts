import { auth } from "@/lib/auth";
import { RESERVED_SLUGS } from "@/lib/organizations/reserved-slugs";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const handleRootRedirect = (request: NextRequest) => {
  const session = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!session) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/orgs";
  return NextResponse.redirect(url);
};

const extractOrgSlug = (pathname: string) => {
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

const validateSession = async (request: NextRequest) => {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!sessionCookie) return null;

  const [session, activeOrganisation] = await Promise.all([
    auth.api.getSession({ headers: request.headers }),
    auth.api.getFullOrganization({ headers: request.headers }),
  ]);

  if (!session?.session.userId) return null;

  return { session, activeOrganisation };
};

const findUserOrganization = async (slug: string, userId: string) => {
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
};

const switchActiveOrganization = async (
  request: NextRequest,
  organizationId: string,
) => {
  await auth.api.setActiveOrganization({
    headers: request.headers,
    body: { organizationId },
  });

  return NextResponse.redirect(request.url);
};

const redirectToOrgList = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/orgs";
  return NextResponse.redirect(url);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  const slug = extractOrgSlug(pathname);
  if (!slug) return NextResponse.next();

  if (RESERVED_SLUGS.includes(slug)) {
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

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};
