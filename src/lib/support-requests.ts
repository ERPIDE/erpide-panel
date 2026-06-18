/**
 * Destek Talepleri storage.
 *
 * Canlı Destek (Eylül chat) ve Bizi Ara (Vapi voice) ile gelen tüm
 * konuşmalar SupportRequest tablosunda tutulur. Admin paneli "Destek
 * Talepleri" sekmesi bu listeyi görür (sadece role === "admin" görür).
 *
 * Şema:
 *  - chat talepleri: sessionId istemciden gelir (sessionStorage), her POST
 *    transcript'i güncel mesaj listesiyle overwrite eder.
 *  - voice talepleri: Vapi webhook (end-of-call-report) call.id'yi sessionId
 *    olarak kullanır; summary ve transcript birden yazılır. Idempotency
 *    externalId üzerinden (Vapi aynı raporu iki kez yollayabiliyor).
 *
 * Önceden tek bir blob (`data/support-requests.json`) — her güncelleme tüm
 * listeyi yeniden yazıyordu, hem yarış hem rate-limit sorunu. Neon'a geçtik.
 */
import { Prisma } from "@prisma/client";
import { getPrisma } from "./db";

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

function rowToRequest(r: {
  id: string;
  channel: string;
  customerName: string | null;
  customerEmail: string | null;
  summary: string | null;
  transcript: Prisma.JsonValue;
  meta: Prisma.JsonValue | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  externalId: string | null;
}): SupportRequest {
  return {
    id: r.id,
    channel: r.channel as SupportChannel,
    customerName: r.customerName ?? undefined,
    customerEmail: r.customerEmail ?? undefined,
    summary: r.summary ?? undefined,
    transcript: (r.transcript as unknown as SupportMessage[]) ?? [],
    meta: (r.meta as unknown as Record<string, unknown> | null) ?? undefined,
    status: r.status as SupportStatus,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    externalId: r.externalId ?? undefined,
  };
}

export async function listSupportRequests(): Promise<SupportRequest[]> {
  const rows = await getPrisma().supportRequest.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(rowToRequest);
}

export async function getSupportRequest(id: string): Promise<SupportRequest | null> {
  const row = await getPrisma().supportRequest.findUnique({ where: { id } });
  return row ? rowToRequest(row) : null;
}

/** Upsert: aynı id varsa overwrite (chat session aynı sessionId ile her POST'ta gelir). */
export async function upsertSupportRequest(req: SupportRequest): Promise<void> {
  const data = {
    id: req.id,
    channel: req.channel,
    customerName: req.customerName ?? null,
    customerEmail: req.customerEmail ?? null,
    summary: req.summary ?? null,
    transcript: (req.transcript ?? []) as unknown as Prisma.InputJsonValue,
    meta: (req.meta ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
    status: req.status,
    externalId: req.externalId ?? null,
  };
  await getPrisma().supportRequest.upsert({
    where: { id: req.id },
    create: {
      ...data,
      createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
    },
    update: data,
  });
}

/** Vapi webhook idempotency: aynı externalId ile çağrı geldiyse skip. */
export async function findByExternalId(externalId: string): Promise<SupportRequest | null> {
  const row = await getPrisma().supportRequest.findUnique({ where: { externalId } });
  return row ? rowToRequest(row) : null;
}

export async function setStatus(id: string, status: SupportStatus): Promise<boolean> {
  try {
    await getPrisma().supportRequest.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return false;
    }
    throw e;
  }
}
