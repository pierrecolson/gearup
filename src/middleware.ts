import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, authEnabled, verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  // No password configured → app is open. Useful for local dev before
  // setting AUTH_PASSWORD.
  if (!authEnabled()) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie && (await verifySession(cookie))) {
    return NextResponse.next();
  }

  // For navigation: redirect to /login with the requested path preserved.
  // For API requests: 401 JSON so fetch callers can react cleanly.
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (req.nextUrl.pathname !== "/") {
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  }
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything *except* the login page, the auth endpoints, and
  // Next.js's own static asset routes. Public favicons stay accessible so
  // the browser tab icon shows on /login.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth/).*)",
  ],
};
