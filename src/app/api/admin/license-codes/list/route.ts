/**
 * GET /api/admin/license-codes/list
 * Admin için tüm e-pin'leri listele (kullanılmamış + kullanılmış).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { listLicenseCodes } from "@/lib/auth/user-store";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const session = await getSession(token);
  if (!session || session.userType !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const codes = await listLicenseCodes();
  // En yeni üstte
  codes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ codes });
}
