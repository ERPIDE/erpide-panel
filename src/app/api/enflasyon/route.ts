/**
 * /api/enflasyon — halka açık Gerçek Enflasyon Raporu API'si.
 *
 * GET: Son koşunun verisi. Herkese: manşet + istatistik + hissedilen
 * bileşenleri + kriz senaryoları (viral kısım). Giriş yapmış site üyesine
 * ek olarak: tüm profiller, kompozit katmanlar ve 283 parametrelik döküm.
 *
 * POST { action: "subscribe" | "unsubscribe" }: üyenin kendi e-postasını
 * aylık rapor listesine ekler/çıkarır (giriş şart; adres formdan alınmaz —
 * hesabın doğrulanmış maili kullanılır).
 *
 * Auth: site üyeliği (erpide_shop_session, iron-session) — admin session DEĞİL.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/user-store";
import { HAS_DB } from "@/lib/db";
import { getLatestRun, getSubscriberByEmail, setSubscriberActiveByEmail } from "@/lib/enflasyon/store";
import type { RunData } from "@/lib/enflasyon/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!HAS_DB) return NextResponse.json({ ready: false }, { status: 500 });
  const run = await getLatestRun();
  if (!run) return NextResponse.json({ ready: false });

  const data = run.data as unknown as RunData;

  const session = await getSession();
  let member = false;
  let subscribed = false;
  if (session.userId) {
    const user = await findUserById(session.userId);
    if (user) {
      member = true;
      const sub = await getSubscriberByEmail(user.email);
      subscribed = !!sub?.active;
    }
  }

  const base = {
    ready: true,
    member,
    subscribed,
    period: data.period,
    computedAt: data.computedAt,
    headline: data.headline,
    stats: data.stats,
    feltLayers: data.feltLayers ?? [],
    // Kriz senaryoları herkese açık — raporun konuşulan kısmı.
    krizProfiles: (data.profiles ?? []).filter((p) => p.group === "kriz"),
  };

  if (!member) return NextResponse.json(base);

  return NextResponse.json({
    ...base,
    profiles: data.profiles ?? [],
    layers: data.layers,
    params: data.params,
    notes: data.notes,
  });
}

export async function POST(req: Request) {
  if (!HAS_DB) return NextResponse.json({ error: "servis hazır değil" }, { status: 500 });
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => null) as { action?: string } | null;
  if (body?.action === "subscribe") {
    await setSubscriberActiveByEmail(user.email, true);
    return NextResponse.json({ ok: true, subscribed: true });
  }
  if (body?.action === "unsubscribe") {
    await setSubscriberActiveByEmail(user.email, false);
    return NextResponse.json({ ok: true, subscribed: false });
  }
  return NextResponse.json({ error: "bilinmeyen action" }, { status: 400 });
}
