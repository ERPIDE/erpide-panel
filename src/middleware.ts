import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATHS = [
  "/admin/dashboard",
  "/admin/tasks",
  "/admin/reports",
  "/admin/users",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const session = req.cookies.get("erpide_session");

  // ===== pocket.erpide.com subdomain rewrite =====
  if (host.startsWith("pocket.")) {
    if (pathname === "/" || pathname === "") {
      const url = req.nextUrl.clone();
      url.pathname = "/pocket";
      return NextResponse.rewrite(url);
    }
  }

  const isAdminRoute = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Cookie yoksa login'e at. Tam session doğrulaması (Neon lookup) admin
  // layout'unda /api/auth/me üzerinden yapılıyor.
  if (isAdminRoute && !session?.value) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // pocket.erpide.com rewrite için root path'i de matcher'a aldık.
  // "/" sadece pocket subdomain'inde rewrite olur, ana erpide.com'da hiçbir şey olmaz.
  matcher: ["/", "/admin/dashboard/:path*", "/admin/tasks/:path*", "/admin/reports/:path*", "/admin/users/:path*"],
};
