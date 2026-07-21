/**
 * /api/customers/members — Müşteri (firma) altındaki kullanıcıların CRUD'u.
 *
 * Yalnız elevated admin (role=admin) erişir. Üyeler /panel'e e-posta+şifre
 * ile girer; rolü panel yetkilerini belirler:
 *   "yonetici" → talep açma + yorum + dosya yükleme
 *   "uye"      → task görme + yorum
 *   "gozlemci" → yalnızca görüntüleme
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export const MEMBER_ROLES = ["yonetici", "uye", "gozlemci"] as const;

async function requireElevated() {
  const store = await cookies();
  return getElevatedSession(store.get(SESSION_COOKIE)?.value);
}

function sanitize(m: { id: string; customerId: string; name: string; email: string; role: string; createdAt: Date }) {
  // password hash'i asla client'a gitmez
  return { id: m.id, customerId: m.customerId, name: m.name, email: m.email, role: m.role, createdAt: m.createdAt };
}

export async function GET(req: NextRequest) {
  if (!(await requireElevated())) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const customerId = req.nextUrl.searchParams.get("customerId");
  const members = await getPrisma().customerMember.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ members: members.map(sanitize) });
}

export async function POST(req: NextRequest) {
  if (!(await requireElevated())) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { customerId, name, email, password, role } = body || {};
  if (!customerId || !name || !email || !password) {
    return NextResponse.json({ error: "customerId, ad, e-posta ve şifre gerekli" }, { status: 400 });
  }
  if (role && !MEMBER_ROLES.includes(role)) {
    return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
  }

  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });

  const emailNorm = String(email).trim().toLowerCase();
  const dup = await prisma.customerMember.findUnique({ where: { email: emailNorm } });
  if (dup) return NextResponse.json({ error: "Bu e-posta ile kayıtlı kullanıcı zaten var" }, { status: 409 });

  const member = await prisma.customerMember.create({
    data: {
      id: randomUUID(),
      customerId,
      name: String(name).trim(),
      email: emailNorm,
      password: await hashPassword(String(password)),
      role: role || "uye",
    },
  });
  return NextResponse.json({ member: sanitize(member) });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireElevated())) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { id, name, email, password, role } = body || {};
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  if (role && !MEMBER_ROLES.includes(role)) {
    return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (name) data.name = String(name).trim();
  if (email) data.email = String(email).trim().toLowerCase();
  if (role) data.role = role;
  if (password) data.password = await hashPassword(String(password));

  const member = await getPrisma().customerMember.update({ where: { id }, data }).catch(() => null);
  if (!member) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  return NextResponse.json({ member: sanitize(member) });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireElevated())) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  await getPrisma().customerMember.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
