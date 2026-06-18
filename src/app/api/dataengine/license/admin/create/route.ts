import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { generateLicenseKey, normalizeLicenseKey, isValidKeyFormat } from "@/lib/dataengine-licenses";

const schema = z.object({
  customer: z.string().min(2).max(200),
  durationDays: z.number().int().positive().max(36500).optional(),
  customerCode: z.string().max(8).optional(),
  customKey: z.string().optional(),  // override: explicit key (advanced)
  note: z.string().max(500).optional(),
});

/** POST — yeni lisans oluştur. durationDays verilmezse perpetual. */
export async function POST(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 });

  const { customer, durationDays, customerCode, customKey, note } = parsed.data;
  let key: string;
  if (customKey) {
    key = normalizeLicenseKey(customKey);
    if (!isValidKeyFormat(key)) {
      return NextResponse.json({ error: "Invalid key format (DE-XXXX-YYYY-ZZZZ-NNNN bekleniyor)" }, { status: 400 });
    }
  } else {
    key = generateLicenseKey(customerCode);
  }

  const db = getPrisma();
  const existing = await db.dataEngineLicense.findUnique({ where: { key } });
  if (existing) return NextResponse.json({ error: "Bu key zaten mevcut" }, { status: 409 });

  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 86400 * 1000)
    : null;

  const lic = await db.dataEngineLicense.create({
    data: {
      key,
      customer,
      productId: "dataengine",
      expiresAt,
      active: true,
      note: note || null,
      createdBy: session.userEmail || session.userName || session.userId,
    },
  });
  return NextResponse.json({ license: lic });
}
