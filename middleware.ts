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
};

export function middleware(req: NextRequest) {
  // Inject the current URL inside the request headers
  // Useful to get the parameters of the current request
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", req.url);

  return NextResponse.next({
    request: {
      // Apply new request headers
      headers: requestHeaders,
    },
  });
}
