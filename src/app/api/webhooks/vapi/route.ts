/**
 * Vapi webhook receiver.
 *
 * Vapi'nin "end-of-call-report" event'i çağrı bittiğinde POST eder; içeriğinde
 * full transcript, AI summary, recordingUrl, durations, cost var. Bunu
 * support-requests blob'una "voice" kanalı olarak kaydediyoruz — admin
 * paneli "Destek Talepleri" sekmesi chat + voice'u tek listede gösterir.
 *
 * Güvenlik: Vapi dashboard'da "Server URL Secret" set edilirse "x-vapi-secret"
 * header'ı gelir; VAPI_WEBHOOK_SECRET env'iyle eşleşmezse 401. Secret
 * tanımlı değilse imza doğrulaması atlanır (geliştirme/ilk kurulum için).
 *
 * Vapi dashboard URL ayarı: Assistant → Server URL = https://erpide.com/api/webhooks/vapi
 */
import { NextResponse } from "next/server";
import {
  upsertSupportRequest,
  findByExternalId,
  type SupportMessage,
} from "@/lib/support-requests";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

interface VapiTranscriptItem {
  role?: string;
  message?: string;
  text?: string;
}
interface VapiCallReport {
  type?: string;
  endedReason?: string;
  call?: {
    id?: string;
    customer?: { number?: string; name?: string };
    startedAt?: string;
    endedAt?: string;
  };
  summary?: string;
  transcript?: string;
  messages?: VapiTranscriptItem[];
  recordingUrl?: string;
  cost?: number;
}

export async function POST(req: Request) {
  // İmza doğrulaması (varsa)
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (expected) {
    const got = req.headers.get("x-vapi-secret") || req.headers.get("x-vapi-signature");
    if (got !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: { message?: VapiCallReport } | VapiCallReport;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Vapi message format'ı: { message: { type, call, ... } } — bazen iç içe
  const message: VapiCallReport = (body as { message?: VapiCallReport }).message || (body as VapiCallReport);
  const type = message?.type || "";

  // Sadece "end-of-call-report" tipini destek talebi olarak kaydet. Diğer
  // event'leri (status-update, function-call vs.) yok say.
  if (type !== "end-of-call-report") {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const callId = message.call?.id;
  if (!callId) {
    return NextResponse.json({ error: "missing_call_id" }, { status: 400 });
  }

  // Idempotency — aynı call tekrar gelirse skip
  const existing = await findByExternalId(callId);
  if (existing) {
    return NextResponse.json({ ok: true, deduped: true, id: existing.id });
  }

  // Transcript'i SupportMessage formatına çevir
  const transcript: SupportMessage[] = (message.messages || [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "bot"))
    .map<SupportMessage>((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.message || m.text || "",
    }))
    .filter((m) => m.content.length > 0);

  const now = new Date().toISOString();
  const customerName = message.call?.customer?.name;
  const customerPhone = message.call?.customer?.number;

  await upsertSupportRequest({
    id: randomUUID(),
    externalId: callId,
    channel: "voice",
    customerName,
    summary: message.summary || message.transcript?.slice(0, 200),
    transcript,
    meta: {
      vapi_call_id: callId,
      phone: customerPhone,
      recordingUrl: message.recordingUrl,
      cost: message.cost,
      startedAt: message.call?.startedAt,
      endedAt: message.call?.endedAt,
      endedReason: message.endedReason,
    },
    status: "open",
    createdAt: message.call?.startedAt || now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true });
}
