/**
 * PUT /api/admin/users/permissions
 * Body: { adminId: string; permissions: ModulePermissions | null }
 *
 * null göndermek DB'deki permissions'ı siler → rol bazlı default'a döner.
 * Sadece role === "admin" olan kullanıcılar çağırabilir.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE, updateAdminPermissions } from "@/lib/auth";
import type { ModulePermissions } from "@/lib/permissions";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await getOwnerSession(token);
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { adminId?: string; permissions?: ModulePermissions | null };

  if (!body.adminId) {
    return NextResponse.json({ error: "adminId zorunlu" }, { status: 400 });
  }

  await updateAdminPermissions(body.adminId, body.permissions ?? null);
  return NextResponse.json({ ok: true });
}
