/**
 * /api/admin/enflasyon/manuel — aylık bülten değerlerinin panelden girişi.
 *
 * TÜİK ve ENAG her ayın 3'ünde açıklanır; API vermezler. Bu route sayesinde
 * kod deploy'u olmadan panelden girilir, sonraki hesaplama koşusu bu değerleri
 * kullanır (registry.ts'teki gömülü değerler yedek olarak kalır).
 *
 * GET  → { tuik, enag } (DB'de yoksa null — UI gömülü varsayılanı gösterir)
 * POST → { key: "tuik"|"enag", yearly, monthly, period: "YYYY-MM" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { getManualValues, setManualValue } from "@/lib/enflasyon/store";
import { TUIK_LATEST, ENAG_LATEST } from "@/lib/enflasyon/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return getElevatedSession(token);
}

export async function GET(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const manual = await getManualValues();
  return NextResponse.json({
    tuik: manual.tuik ?? null,
    enag: manual.enag ?? null,
    defaults: {
      tuik: { yearly: TUIK_LATEST.yearly, monthly: TUIK_LATEST.monthly, period: TUIK_LATEST.period },
      enag: { yearly: ENAG_LATEST.yearly, monthly: ENAG_LATEST.monthly, period: ENAG_LATEST.period },
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const body = await req.json().catch(() => null) as
    | { key?: string; yearly?: number; monthly?: number; period?: string }
    | null;

  if (body?.key !== "tuik" && body?.key !== "enag") {
    return NextResponse.json({ error: "key 'tuik' veya 'enag' olmalı" }, { status: 400 });
  }
  const yearly = Number(body.yearly);
  const monthly = Number(body.monthly);
  const period = String(body.period || "");
  if (!isFinite(yearly) || yearly < -50 || yearly > 500) {
    return NextResponse.json({ error: "yıllık değer mantıksız görünüyor" }, { status: 400 });
  }
  if (!isFinite(monthly) || monthly < -50 || monthly > 100) {
    return NextResponse.json({ error: "aylık değer mantıksız görünüyor" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "dönem YYYY-MM biçiminde olmalı" }, { status: 400 });
  }

  await setManualValue(body.key, { yearly, monthly, period });
  return NextResponse.json({ ok: true });
}
