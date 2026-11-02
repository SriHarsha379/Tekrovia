import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/verify-otp", "/trial"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("tekrovia_token")?.value;

  if (token && token.length > 10) return NextResponse.next();

  // For dashboard and admin — let the page load and handle auth client-side
  // This prevents the refresh-to-login issue since the inline script
  // restores the cookie but only after the page loads
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.jpg$|.*\\.webp$).*)",
  ],
};
