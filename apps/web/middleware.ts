import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/verify-otp"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const token = request.cookies.get("tekrovia_token")?.value;
  const hasValidToken = token && token.length > 20;

  // Protected route — no token → login
  if (!isPublic && !hasValidToken) {
    const loginUrl = new URL("/login", request.url);
    // Don't set ?next for dashboard/admin root to avoid redirect loops
    if (pathname !== "/dashboard" && pathname !== "/admin") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in — don't redirect back to dashboard from login
  // Let the login page handle role-based routing itself
  if (hasValidToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.jpg$|.*\\.webp$).*)",
  ],
};
