/**
 * /api/pocket/web-sync — Web /pocket sayfası için cloud sync endpoint'i.
 *
 * Mobile aynı veriyi /api/pocket/sync üzerinden (Bearer pkt_xxx) çekiyor;
 * web kullanıcısı cookie session ile bu uca gelir, aynı pocket-store'u
 * tüketir → web ↔ mobile aynı PocketData'yı paylaşır.
 *
 * GET   → buluttaki snapshot ({ updatedAt, data })
 * POST  → body { data } overwrite (last-write-wins)
 *
 * Auth: Shop session cookie (giriş yapmış kullanıcı). Yoksa 401.
 * Lisans: PocketERPIDE aktif değilse yine çalışır — MVP'de kullanıcı
 * lisanssız da localStorage'daki verisini cloud'a yedekleyebilsin
 * (cihaz kaybında veri kaybı yaşamasın). Push notification + mobile
 * app kullanımı lisanslıya açık.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserData, setUserData } from "@/lib/pocket-store";

export const runtime = "nodejs";


export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rec = await getUserData(session.userId);
  if (!rec) {
    return NextResponse.json({ updatedAt: null, data: null });
  }
  return NextResponse.json({ updatedAt: rec.updatedAt, data: rec.data });
}


export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("data" in body)) {
    return NextResponse.json({ error: "missing_data" }, { status: 400 });
  }
  const data = (body as { data: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return NextResponse.json({ error: "data_must_be_object" }, { status: 400 });
  }

  // Payload size guard — pocket bireysel kullanıcı, normalde < 50KB
  const payloadSize = JSON.stringify(data).length;
  if (payloadSize > 500_000) {
    return NextResponse.json({ error: "payload_too_large", size: payloadSize }, { status: 413 });
  }

  const rec = await setUserData(session.userId, data);
  return NextResponse.json({ ok: true, updatedAt: rec.updatedAt });
}
