import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_id");

  // Rotas públicas com sessão ativa → redirect para home
  if (publicPaths.some((p) => pathname.startsWith(p)) && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Rotas protegidas sem cookie → redirect para login
  if (!publicPaths.some((p) => pathname.startsWith(p)) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
