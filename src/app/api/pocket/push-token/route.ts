import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateMobile } from "@/lib/pocket-auth";
import { registerPushToken, unregisterPushToken } from "@/lib/pocket-store";

export const runtime = "nodejs";

/**
 * POST /api/pocket/push-token
 *
 * Mobile app login sonrası veya Ayarlar'dan push-notification açıldığında
 * çağrılır. Expo push tokenını kullanıcıya bağlar — sonra cron'lar
 * (örn. yaklaşan ödeme hatırlatıcısı) bu tokenları kullanarak bildirim atar.
 */
const registerSchema = z.object({
  expoPushToken: z.string().min(10).max(500),
  platform: z.enum(["ios", "android", "web"]).default("ios"),
  deviceName: z.string().max(120).default("unknown"),
});

export async function POST(req: Request) {
  const auth = await authenticateMobile(req);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const rec = await registerPushToken(
    auth.userId,
    parsed.data.expoPushToken,
    parsed.data.platform,
    parsed.data.deviceName,
  );

  return NextResponse.json({ ok: true, registeredAt: rec.lastUsedAt });
}

/**
 * DELETE /api/pocket/push-token
 *
 * Kullanıcı push'u kapatınca veya logout sırasında çağrılır.
 * expoPushToken request body'de gelir; sadece sahibi silebilir.
 */
const deleteSchema = z.object({
  expoPushToken: z.string().min(10).max(500),
});

export async function DELETE(req: Request) {
  const auth = await authenticateMobile(req);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const ok = await unregisterPushToken(auth.userId, parsed.data.expoPushToken);
  if (!ok) {
    // Already gone or never existed — idempotent, 200 dönüyoruz
    return NextResponse.json({ ok: true, note: "Token zaten yoktu" });
  }
  return NextResponse.json({ ok: true });
}
