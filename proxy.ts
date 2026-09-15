import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { wwwToApexUrl } from "@/lib/site";

export async function proxy(request: NextRequest) {
  const apex = wwwToApexUrl(request.nextUrl);
  if (apex) {
    return NextResponse.redirect(apex, 308);
  }

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await verifyAdminSession(token))) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

/**
 * Keep this matcher admin-only. A site-wide matcher forces `/` and `/intake`
 * through the Worker on every request (including `?_rsc=` prefetches) and
 * was part of the post-PR#27 exceededCpu hang pattern.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
