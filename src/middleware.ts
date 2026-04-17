import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATHS = [
  "/admin/dashboard",
  "/admin/tasks",
  "/admin/reports",
  "/admin/users",
];

const PANEL_PATHS = [
  "/panel",
];

// Lightweight session check — full validation happens in /api/auth/me
// but we need to read the blob to check userType
async function getSessionType(token: string): Promise<string | null> {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || "";
    const parts = blobToken.split("_");
    if (parts.length < 4) return null;
    const storeId = parts[3].toLowerCase();
    const baseUrl = `https://${storeId}.public.blob.vercel-storage.com`;
    const res = await fetch(`${baseUrl}/sessions/${token}.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const session = await res.json();
    if (new Date(session.expiresAt) < new Date()) return null;
    return session.userType || null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("erpide_session");

  const isAdminRoute = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAdminRoute) {
    if (!session?.value) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Check that the session belongs to an admin, not a customer
    const userType = await getSessionType(session.value);
    if (userType !== "admin") {
      // Clear invalid session and redirect to admin login
      const res = NextResponse.redirect(new URL("/admin", req.url));
      res.cookies.delete("erpide_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/tasks/:path*", "/admin/reports/:path*", "/admin/users/:path*"],
};
