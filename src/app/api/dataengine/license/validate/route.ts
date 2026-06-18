import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { normalizeLicenseKey } from "@/lib/dataengine-licenses";

/**
 * POST /api/dataengine/license/validate
 *
 * Müşteri sunucusundaki dataengine.exe startup'ta (ve gelecekte periyodik)
 * çağırır. valid=false → exe açılmaz / durdurur. Her başarılı validate'de
 * lastValidatedAt + lastClientVersion + lastSeenIp güncellenir (admin UI'da
 * son ne zaman görüldüğünü izleriz).
 *
 * Fingerprint binding henüz sert kural değil — ilk validate'de set edilir,
 * sonraki sapmalarda sadece log atılır (Faz 3: ikinci makinada exe açılmasın).
 */

const schema = z.object({
  key: z.string().min(8).max(64),
  fingerprint: z.string().max(300).optional(),
  product: z.string().max(64).optional(),
  version: z.string().max(64).optional(),
});

function unauthorized(reason: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ valid: false, reason, ...extra }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: "Invalid request" }, { status: 400 });
  }

  const key = normalizeLicenseKey(parsed.data.key);
  const db = getPrisma();
  const lic = await db.dataEngineLicense.findUnique({ where: { key } });

  if (!lic) return unauthorized("Bilinmeyen lisans anahtarı");
  if (!lic.active) return unauthorized("Lisans askıya alınmış");
  if (lic.expiresAt && lic.expiresAt < new Date()) {
    return unauthorized("Lisans süresi dolmuş", { expires_at: lic.expiresAt.toISOString() });
  }

  // İzleme alanlarını güncelle (best-effort; başarısız olsa bile valid response döner).
  const fp = parsed.data.fingerprint;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null;
  try {
    await db.dataEngineLicense.update({
      where: { key },
      data: {
        lastValidatedAt: new Date(),
        lastClientVersion: parsed.data.version || null,
        lastSeenIp: ip,
        // Aktivasyon: fingerprint ilk gelenle birlikte set, sonra dokunma
        ...(fp && !lic.activeFingerprint
          ? { activeFingerprint: fp, firstSeenAt: new Date() }
          : {}),
      },
    });
  } catch (e) {
    console.error("[dataengine.license] update tracking failed:", e);
  }

  return NextResponse.json({
    valid: true,
    customer: lic.customer,
    expires_at: lic.expiresAt?.toISOString() ?? null,
    note: lic.note ?? null,
  });
}
