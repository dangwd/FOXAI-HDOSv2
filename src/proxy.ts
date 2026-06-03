import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/login",
  "/unauthorized",
  "/silent-check-sso.html",
]);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpired(payload: Record<string, unknown>): boolean {
  const exp = payload["exp"] as number | undefined;
  if (!exp) return true;
  return Date.now() >= exp * 1000;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("auth_token")?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!payload && !isExpired(payload);

  // Already logged in → skip login page
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/client", request.url));
    }
    return NextResponse.next();
  }

  // Always-public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Guard: redirect unauthenticated to /login, preserve intended path
  // if (!isAuthenticated) {
  //   const loginUrl = new URL('/login', request.url);
  //   loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
  //   return NextResponse.redirect(loginUrl);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
