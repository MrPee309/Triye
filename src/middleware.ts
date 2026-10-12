import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const AUTH_PAGES = ["/login", "/register"];

// Page-level guard. API routes enforce auth themselves (requireUserId).
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!userId && !isAuthPage) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (userId && isAuthPage) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico|robots.txt).*)"],
};
