import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/admin/dashboard",
  "/admin/tasks",
  "/admin/reports",
  "/admin/users",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the path is a protected admin route
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected) {
    const session = req.cookies.get("erpide_session");

    if (!session?.value) {
      const loginUrl = new URL("/admin", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/tasks/:path*", "/admin/reports/:path*", "/admin/users/:path*"],
};
