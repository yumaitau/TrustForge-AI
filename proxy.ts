import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/registry", "/search", "/admin", "/settings"];

export default function proxy(request: NextRequest) {
  const protectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  if (!protectedPath) return NextResponse.next();

  const sessionToken = request.cookies.get("better-auth.session_token")?.value;
  if (sessionToken) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = { matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)"] };
