/**
 * GET  /api/admin/vapi  — Vapi assistant config (mevcut prompt'u getir)
 * PATCH /api/admin/vapi — Body { systemPrompt, firstMessage? } ile assistant'ı güncelle
 *
 * Env:
 *  - VAPI_PRIVATE_KEY: Vapi dashboard → Org → API Keys → Private Key
 *  - NEXT_PUBLIC_VAPI_ASSISTANT_ID: hangi assistant güncellenecek
 *
 * Sadece elevated admin (role === "admin") erişebilir.
 */
import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const VAPI_API_BASE = "https://api.vapi.ai";

interface VapiAssistant {
  id: string;
  name?: string;
  firstMessage?: string;
  model?: {
    provider?: string;
    model?: string;
    messages?: Array<{ role: string; content: string }>;
  };
  voice?: { provider?: string; voiceId?: string };
}

function getConfig() {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  const assistantId =
    process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  return { apiKey, assistantId };
}

export async function GET(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { apiKey, assistantId } = getConfig();
  if (!apiKey || !assistantId) {
    return NextResponse.json(
      { error: "vapi_not_configured", detail: "VAPI_PRIVATE_KEY ve VAPI_ASSISTANT_ID env değişkenleri lazım." },
      { status: 503 }
    );
  }

  try {
    const r = await fetch(`${VAPI_API_BASE}/assistant/${assistantId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: "vapi_error", status: r.status, detail: text }, { status: 502 });
    }
    const assistant: VapiAssistant = await r.json();
    const systemPrompt = assistant.model?.messages?.find((m) => m.role === "system")?.content || "";
    return NextResponse.json({
      ok: true,
      assistantId: assistant.id,
      name: assistant.name,
      firstMessage: assistant.firstMessage,
      systemPrompt,
      model: assistant.model?.model,
      voice: assistant.voice,
    });
  } catch (e) {
    return NextResponse.json({ error: "fetch_failed", detail: String(e) }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { apiKey, assistantId } = getConfig();
  if (!apiKey || !assistantId) {
    return NextResponse.json(
      { error: "vapi_not_configured" },
      { status: 503 }
    );
  }

  let body: { systemPrompt?: string; firstMessage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Mevcut assistant'ı al → system message'ı güncelle → PATCH
  let current: VapiAssistant;
  try {
    const r = await fetch(`${VAPI_API_BASE}/assistant/${assistantId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: "vapi_fetch_failed", status: r.status, detail: text }, { status: 502 });
    }
    current = await r.json();
  } catch (e) {
    return NextResponse.json({ error: "vapi_fetch_failed", detail: String(e) }, { status: 502 });
  }

  // PATCH payload — sadece değişen field'ları yolla
  const patchPayload: Partial<VapiAssistant> = {};

  if (typeof body.systemPrompt === "string") {
    const currentModel = current.model || {};
    const messages = (currentModel.messages || []).filter((m) => m.role !== "system");
    messages.unshift({ role: "system", content: body.systemPrompt });
    patchPayload.model = { ...currentModel, messages };
  }

  if (typeof body.firstMessage === "string") {
    patchPayload.firstMessage = body.firstMessage;
  }

  if (Object.keys(patchPayload).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  try {
    const r = await fetch(`${VAPI_API_BASE}/assistant/${assistantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchPayload),
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: "vapi_patch_failed", status: r.status, detail: text }, { status: 502 });
    }
    const updated: VapiAssistant = await r.json();
    const systemPrompt = updated.model?.messages?.find((m) => m.role === "system")?.content || "";
    return NextResponse.json({
      ok: true,
      systemPrompt,
      firstMessage: updated.firstMessage,
    });
  } catch (e) {
    return NextResponse.json({ error: "vapi_patch_failed", detail: String(e) }, { status: 502 });
  }
}
