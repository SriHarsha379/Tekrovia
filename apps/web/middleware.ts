import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/verify-otp", "/trial"];

// These paths need auth but we give client a chance to restore token
// by showing the page briefly instead of hard redirecting
const SOFT_AUTH_PATHS = ["/admin", "/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("tekrovia_token")?.value;
  const hasToken = token && token.length > 10;

  if (hasToken) return NextResponse.next();

  // No cookie — redirect to login
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/dashboard" && pathname !== "/admin") {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.jpg$|.*\\.webp$).*)",
  ],
};
