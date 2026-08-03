/**
 * /api/admin/enflasyon/subscribers — rapor abone listesi yönetimi.
 *
 * POST   { email, name? }      ekle (varsa yeniden aktifleştirir)
 * PATCH  { id, active }        aktif/pasif
 * DELETE { id }                sil
 */
import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { addSubscriber, removeSubscriber, toggleSubscriber } from "@/lib/enflasyon/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function guard(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return getElevatedSession(token);
}

export async function POST(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const body = await req.json().catch(() => null) as { email?: string; name?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "geçerli bir e-posta adresi gir" }, { status: 400 });
  }
  const sub = await addSubscriber(email, body?.name);
  return NextResponse.json({ ok: true, subscriber: sub });
}

export async function PATCH(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { id?: string; active?: boolean } | null;
  if (!body?.id || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "id ve active gerekli" }, { status: 400 });
  }
  const sub = await toggleSubscriber(body.id, body.active);
  return NextResponse.json({ ok: true, subscriber: sub });
}

export async function DELETE(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  await removeSubscriber(body.id);
  return NextResponse.json({ ok: true });
}
