/**
 * PocketERPIDE mobile backend storage.
 *
 * Şema (Vercel Blob):
 *  - data/pocket-tokens.json  → token → { userId, label, createdAt, lastUsedAt }
 *  - data/pocket-data.json    → userId → PocketData
 *
 * Her kullanıcı kendi verisini görür. License kontrolü endpoint katmanında.
 */
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";

export interface PocketTokenRecord {
  userId: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface PocketDataRecord {
  /** Mobile'in en son sync ettiği zaman damgası — conflict resolution için. */
  updatedAt: string;
  /** Tüm PocketData JSON (any — backend bunun shape'ine bakmaz, mobil oluşturur). */
  data: unknown;
}

const TOKENS_KEY = "data/pocket-tokens.json";
const DATA_KEY = "data/pocket-data.json";

function getBlobBaseUrl(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";
  const parts = token.split("_");
  if (parts.length >= 4) {
    const storeId = parts[3].toLowerCase();
    return `https://${storeId}.public.blob.vercel-storage.com`;
  }
  return "";
}

async function readBlob<T>(key: string, fallback: T): Promise<T> {
  try {
    const baseUrl = getBlobBaseUrl();
    if (!baseUrl) return fallback;
    const res = await fetch(`${baseUrl}/${key}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function writeBlob(key: string, value: unknown): Promise<void> {
  await put(key, JSON.stringify(value, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ===== TOKENS =====

async function readTokens(): Promise<Record<string, PocketTokenRecord>> {
  return await readBlob<Record<string, PocketTokenRecord>>(TOKENS_KEY, {});
}

async function writeTokens(tokens: Record<string, PocketTokenRecord>): Promise<void> {
  await writeBlob(TOKENS_KEY, tokens);
}

export async function issueToken(userId: string, label = "mobile"): Promise<string> {
  const tokens = await readTokens();
  const token = "pkt_" + randomBytes(24).toString("base64url");
  tokens[token] = {
    userId,
    label,
    createdAt: new Date().toISOString(),
  };
  await writeTokens(tokens);
  return token;
}

export async function validateToken(token: string): Promise<PocketTokenRecord | null> {
  if (!token || !token.startsWith("pkt_")) return null;
  const tokens = await readTokens();
  const rec = tokens[token];
  if (!rec) return null;
  // lastUsedAt'i güncelle (fire-and-forget)
  rec.lastUsedAt = new Date().toISOString();
  tokens[token] = rec;
  writeTokens(tokens).catch(() => {});
  return rec;
}

export async function revokeToken(token: string): Promise<boolean> {
  const tokens = await readTokens();
  if (!tokens[token]) return false;
  delete tokens[token];
  await writeTokens(tokens);
  return true;
}

export async function listTokensForUser(userId: string): Promise<Array<{ token: string } & PocketTokenRecord>> {
  const tokens = await readTokens();
  return Object.entries(tokens)
    .filter(([, rec]) => rec.userId === userId)
    .map(([token, rec]) => ({ token, ...rec }));
}

// ===== POCKET DATA =====

async function readAllData(): Promise<Record<string, PocketDataRecord>> {
  return await readBlob<Record<string, PocketDataRecord>>(DATA_KEY, {});
}

async function writeAllData(map: Record<string, PocketDataRecord>): Promise<void> {
  await writeBlob(DATA_KEY, map);
}

export async function getUserData(userId: string): Promise<PocketDataRecord | null> {
  const map = await readAllData();
  return map[userId] || null;
}

export async function setUserData(userId: string, data: unknown): Promise<PocketDataRecord> {
  const map = await readAllData();
  const rec: PocketDataRecord = {
    updatedAt: new Date().toISOString(),
    data,
  };
  map[userId] = rec;
  await writeAllData(map);
  return rec;
}
