/**
 * Destek Talepleri storage.
 *
 * Canlı Destek (Eylül chat) ve Bizi Ara (Vapi voice) ile gelen tüm
 * konuşmalar blob'a kaydedilir. Admin paneli "Destek Talepleri" sekmesi
 * bu listeyi görür (sadece role === "admin" görür).
 *
 * Şema:
 *  - chat talepleri: sessionId istemciden gelir (sessionStorage), her POST
 *    transcript'i güncel mesaj listesiyle overwrite eder.
 *  - voice talepleri: Vapi webhook (end-of-call-report) call.id'yi sessionId
 *    olarak kullanır; summary ve transcript birden yazılır.
 *
 * Bu dosya server-only. Blob put/read için @vercel/blob.
 */
import { put } from "@vercel/blob";

export type SupportChannel = "chat" | "voice";
export type SupportStatus = "open" | "resolved";

export interface SupportMessage {
  role: "user" | "assistant";
  content: string;
  /** ISO timestamp */
  at?: string;
}

export interface SupportRequest {
  id: string;
  channel: SupportChannel;
  customerName?: string;
  customerEmail?: string;
  /** Voice için Vapi'nin üreteceği call summary; chat için son N mesajdan otomatik. */
  summary?: string;
  transcript: SupportMessage[];
  /** Vapi call için telefon, costing ve recording URL'leri ek-meta. */
  meta?: Record<string, unknown>;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  /** Vapi voice çağrılarında call id (idempotency için). */
  externalId?: string;
}

const BLOB_KEY = "data/support-requests.json";

function getBlobBaseUrl(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";
  const parts = token.split("_");
  if (parts.length >= 4) {
    const storeId = parts[3].toLowerCase();
    return `https://${storeId}.public.blob.vercel-storage.com`;
  }
  return "";
}

async function readAll(): Promise<SupportRequest[]> {
  try {
    const baseUrl = getBlobBaseUrl();
    if (!baseUrl) return [];
    const res = await fetch(`${baseUrl}/${BLOB_KEY}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as SupportRequest[];
  } catch {
    return [];
  }
}

async function writeAll(items: SupportRequest[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(items, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function listSupportRequests(): Promise<SupportRequest[]> {
  const items = await readAll();
  // En yeni üstte
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSupportRequest(id: string): Promise<SupportRequest | null> {
  const items = await readAll();
  return items.find((r) => r.id === id) || null;
}

/** Upsert: aynı id varsa overwrite (chat session aynı sessionId ile her POST'ta gelir). */
export async function upsertSupportRequest(req: SupportRequest): Promise<void> {
  const items = await readAll();
  const idx = items.findIndex((r) => r.id === req.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...req, updatedAt: new Date().toISOString() };
  } else {
    items.push({ ...req, updatedAt: req.updatedAt || new Date().toISOString() });
  }
  await writeAll(items);
}

/** Vapi webhook idempotency: aynı externalId ile çağrı geldiyse skip. */
export async function findByExternalId(externalId: string): Promise<SupportRequest | null> {
  const items = await readAll();
  return items.find((r) => r.externalId === externalId) || null;
}

export async function setStatus(id: string, status: SupportStatus): Promise<boolean> {
  const items = await readAll();
  const idx = items.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  items[idx].status = status;
  items[idx].updatedAt = new Date().toISOString();
  await writeAll(items);
  return true;
}
