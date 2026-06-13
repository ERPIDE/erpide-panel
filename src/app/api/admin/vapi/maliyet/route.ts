/**
 * GET /api/admin/vapi/maliyet?days=30
 *
 * Vapi'nin /call endpoint'inden son N gündeki çağrıları çek; toplam
 * maliyet, dakika, başarı oranı, dil dağılımı vb. agregat döner.
 *
 * Vapi API rate limit: ~100 req/min, page size 100. Şimdilik
 * pagination yapmıyoruz — son 30 gün için 100 çağrıdan az bir hacim
 * varsayılıyor (yeni ürün). Hacim büyürse "createdAtGt" iterasyonu.
 */
import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const VAPI_API_BASE = "https://api.vapi.ai";


interface VapiCall {
  id: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  cost?: number;
  costBreakdown?: {
    transport?: number;
    stt?: number;
    llm?: number;
    tts?: number;
    vapi?: number;
    total?: number;
  };
  customer?: { number?: string };
  summary?: string;
  transcript?: string;
}


export async function GET(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "vapi_not_configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30", 10), 1), 90);
  const since = new Date(Date.now() - days * 86400_000);

  let calls: VapiCall[] = [];
  try {
    const r = await fetch(
      `${VAPI_API_BASE}/call?createdAtGt=${encodeURIComponent(since.toISOString())}&limit=100`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    );
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: "vapi_error", status: r.status, detail: text.slice(0, 500) }, { status: 502 });
    }
    calls = await r.json();
    if (!Array.isArray(calls)) calls = [];
  } catch (e) {
    return NextResponse.json({ error: "fetch_failed", detail: String(e) }, { status: 502 });
  }

  // Agregatlar
  let totalCost = 0;
  let totalMinutes = 0;
  let successfulCalls = 0;
  let failedCalls = 0;
  const byDay = new Map<string, { calls: number; cost: number; minutes: number }>();
  const byEndReason = new Map<string, number>();
  const langGuesses = new Map<string, number>();
  const costByType = { transport: 0, stt: 0, llm: 0, tts: 0, vapi: 0 };
  const recentTop: Array<{ id: string; startedAt?: string; minutes: number; cost: number; summary?: string; endedReason?: string }> = [];

  for (const c of calls) {
    const start = c.startedAt ? new Date(c.startedAt) : null;
    const end = c.endedAt ? new Date(c.endedAt) : null;
    const dur = start && end ? (end.getTime() - start.getTime()) / 60000 : 0;
    totalMinutes += dur;
    totalCost += c.cost || 0;
    if (dur >= 0.05 && c.endedReason !== "customer-ended-call-immediately") successfulCalls++;
    else failedCalls++;

    if (c.costBreakdown) {
      costByType.transport += c.costBreakdown.transport || 0;
      costByType.stt += c.costBreakdown.stt || 0;
      costByType.llm += c.costBreakdown.llm || 0;
      costByType.tts += c.costBreakdown.tts || 0;
      costByType.vapi += c.costBreakdown.vapi || 0;
    }

    const dayKey = (c.createdAt || "").slice(0, 10);
    if (dayKey) {
      const cur = byDay.get(dayKey) || { calls: 0, cost: 0, minutes: 0 };
      cur.calls++;
      cur.cost += c.cost || 0;
      cur.minutes += dur;
      byDay.set(dayKey, cur);
    }

    if (c.endedReason) {
      byEndReason.set(c.endedReason, (byEndReason.get(c.endedReason) || 0) + 1);
    }

    // Dil tahmini — transcript'in ilk 200 char'ından
    const text = (c.transcript || c.summary || "").slice(0, 200).toLowerCase();
    let lang = "?";
    if (/[а-я]/.test(text)) lang = "RU";
    else if (/[çğıöşüâ]/.test(text)) lang = "TR";
    else if (text && /[a-z]/.test(text)) lang = "EN";
    langGuesses.set(lang, (langGuesses.get(lang) || 0) + 1);

    if (recentTop.length < 10) {
      recentTop.push({
        id: c.id,
        startedAt: c.startedAt,
        minutes: dur,
        cost: c.cost || 0,
        summary: c.summary?.slice(0, 160),
        endedReason: c.endedReason,
      });
    }
  }

  const dailySeries = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    ok: true,
    days,
    totalCalls: calls.length,
    successfulCalls,
    failedCalls,
    totalCostUsd: Number(totalCost.toFixed(4)),
    totalMinutes: Number(totalMinutes.toFixed(1)),
    avgCostPerCall: calls.length > 0 ? Number((totalCost / calls.length).toFixed(4)) : 0,
    avgMinutesPerCall: calls.length > 0 ? Number((totalMinutes / calls.length).toFixed(2)) : 0,
    costPerMinute: totalMinutes > 0 ? Number((totalCost / totalMinutes).toFixed(4)) : 0,
    costByType: {
      transport: Number(costByType.transport.toFixed(4)),
      stt: Number(costByType.stt.toFixed(4)),
      llm: Number(costByType.llm.toFixed(4)),
      tts: Number(costByType.tts.toFixed(4)),
      vapi: Number(costByType.vapi.toFixed(4)),
    },
    languageMix: Object.fromEntries(langGuesses),
    endReasons: Object.fromEntries(byEndReason),
    dailySeries,
    recentTop,
  });
}
