/**
 * GET /api/cron/enflasyon-report  (her ayın 5'i, 09:00 UTC = 12:00 TR)
 *
 * Ayın 5'i seçildi: TÜİK enflasyonu ayın 3'ünde, ENAG aynı gün açıklanır —
 * motor koşarken bir önceki ayın verisi hazır olur.
 *
 * Idempotency: aynı period için bu ay zaten gönderilmiş bir koşu varsa
 * ikinci kez mail atılmaz (cron çift tetiklense bile).
 *
 * Auth: Vercel cron `Authorization: Bearer <CRON_SECRET>` gönderir —
 * trial-reminders'daki sabit-zamanlı karşılaştırma kalıbı.
 */
import { NextResponse } from "next/server";
import { getPrisma, HAS_DB } from "@/lib/db";
import { createRun, sendReport } from "@/lib/enflasyon/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizedAsCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (auth.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < auth.length; i++) mismatch |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

export async function GET(req: Request) {
  if (!authorizedAsCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL yok" }, { status: 500 });

  const { id, data } = await createRun("cron");

  const alreadySent = await getPrisma().inflationRun.findFirst({
    where: { period: data.period, sentAt: { not: null }, id: { not: id } },
  });
  if (alreadySent) {
    console.log("[enflasyon-cron] bu dönem zaten gönderilmiş, atlanıyor:", data.period);
    return NextResponse.json({ ok: true, runId: id, period: data.period, skipped: "bu dönem zaten gönderildi" });
  }

  const result = await sendReport(id);
  console.log("[enflasyon-cron]", { period: data.period, real: data.headline.real, ...result });
  return NextResponse.json({ ok: true, runId: id, period: data.period, headline: data.headline, ...result });
}
