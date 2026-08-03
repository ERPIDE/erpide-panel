/**
 * /api/admin/enflasyon
 *
 * GET  → son koşu + koşu geçmişi + aboneler + kaynak durumu (panel dashboard'u)
 * POST → { action: "run" }              yeni hesaplama koşusu
 *        { action: "send", runId? }     raporu abonelere gönder (runId yoksa son koşu)
 *        { action: "run-and-send" }     manuel "hesapla + gönder" butonu
 */
import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { createRun, getLatestRun, listRuns, listSubscribers, sendReport } from "@/lib/enflasyon/store";
import { hasEvdsKey } from "@/lib/enflasyon/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Motor ~30 dış çağrı yapıyor (TCMB arşiv yürüyüşü dahil) — varsayılan 10 sn yetmez.
export const maxDuration = 60;

async function guard(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return getElevatedSession(token);
}

export async function GET(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const [latest, runs, subscribers] = await Promise.all([getLatestRun(), listRuns(), listSubscribers()]);
  return NextResponse.json({
    latest,
    runs,
    subscribers,
    env: {
      evdsKey: hasEvdsKey(),
      resendKey: !!process.env.RESEND_API_KEY,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  let body: { action?: string; runId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "geçersiz istek" }, { status: 400 });
  }

  try {
    if (body.action === "run") {
      const { id, data } = await createRun("manual");
      return NextResponse.json({ ok: true, runId: id, headline: data.headline, stats: data.stats });
    }

    if (body.action === "send") {
      const runId = body.runId || (await getLatestRun())?.id;
      if (!runId) return NextResponse.json({ error: "gönderilecek koşu yok — önce hesaplama yap" }, { status: 400 });
      const result = await sendReport(runId);
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "run-and-send") {
      const { id } = await createRun("manual");
      const result = await sendReport(id);
      return NextResponse.json({ ok: true, runId: id, ...result });
    }

    return NextResponse.json({ error: "bilinmeyen action" }, { status: 400 });
  } catch (e) {
    console.error("[enflasyon] POST hatası:", e);
    return NextResponse.json({ error: "işlem başarısız" }, { status: 500 });
  }
}
