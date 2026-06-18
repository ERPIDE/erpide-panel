import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DATAENGINE_LICENSES } from "@/lib/dataengine-licenses";

/**
 * POST /api/dataengine/license/validate
 *
 * Müşteri sunucusundaki dataengine.exe startup'ta ve her 12 saatte bir bu
 * endpoint'i çağırır. valid=false → exe açılmaz / çalışmayı durdurur
 * (client side `app/license_check.py` mantığı). Detaylı plan için
 * project_dataengine_production memory'si.
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

  const key = parsed.data.key.trim().toUpperCase();
  const lic = DATAENGINE_LICENSES[key];

  if (!lic) return unauthorized("Bilinmeyen lisans anahtarı");
  if (!lic.active) return unauthorized("Lisans askıya alınmış");

  if (lic.expiresAt) {
    const exp = new Date(lic.expiresAt);
    if (Number.isFinite(exp.getTime()) && exp < new Date()) {
      return unauthorized("Lisans süresi dolmuş", { expires_at: lic.expiresAt });
    }
  }

  return NextResponse.json({
    valid: true,
    customer: lic.customer,
    expires_at: lic.expiresAt,
    note: lic.note ?? null,
  });
}
