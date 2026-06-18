import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { normalizeLicenseKey } from "@/lib/dataengine-licenses";

const schema = z.object({
  key: z.string(),
  active: z.boolean(),
});

/** POST — bir lisansı askıya al (active=false) veya tekrar aktive et (active=true).
 * Müşteri exe'si bir sonraki validate'de reddi görür ve durur. */
export async function POST(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const key = normalizeLicenseKey(parsed.data.key);
  const db = getPrisma();
  const existing = await db.dataEngineLicense.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lic = await db.dataEngineLicense.update({
    where: { key },
    data: { active: parsed.data.active },
  });
  return NextResponse.json({ license: lic });
}
