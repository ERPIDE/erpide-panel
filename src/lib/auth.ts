import { put } from "@vercel/blob";
import {
  AdminUser,
  CustomerUser,
  initialAdmins,
  initialCustomers,
} from "./store";

// ── Session type ──────────────────────────────────────────────────

export interface Session {
  token: string;
  userId: string;
  userType: "admin" | "customer";
  userName: string;
  userRole?: string;
  customerCode?: string;
  createdAt: string;
  expiresAt: string;
}

export const SESSION_COOKIE = "erpide_session";
const SESSION_EXPIRY_DAYS = 7;

// ── Blob helpers ──────────────────────────────────────────────────

function getBlobBaseUrl(): string {
  // Extract store ID from token: vercel_blob_rw_{storeId}_{rest}
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

async function writeBlob(key: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  await put(key, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ── Admin CRUD ────────────────────────────────────────────────────

export async function getAdmins(): Promise<AdminUser[]> {
  return readBlob<AdminUser[]>("data/admins.json", initialAdmins);
}

export async function saveAdmins(admins: AdminUser[]): Promise<void> {
  await writeBlob("data/admins.json", admins);
}

// ── Customer CRUD ─────────────────────────────────────────────────

export async function getCustomers(): Promise<CustomerUser[]> {
  return readBlob<CustomerUser[]>("data/customers.json", initialCustomers);
}

export async function saveCustomers(
  customers: CustomerUser[]
): Promise<void> {
  await writeBlob("data/customers.json", customers);
}

// ── Session management (each session = separate blob file) ───────

export async function createSession(data: {
  userId: string;
  userType: "admin" | "customer";
  userName: string;
  userRole?: string;
  customerCode?: string;
}): Promise<string> {
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const session: Session = {
    token,
    userId: data.userId,
    userType: data.userType,
    userName: data.userName,
    userRole: data.userRole,
    customerCode: data.customerCode,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Each session is its own blob — no cache conflict
  await writeBlob(`sessions/${token}.json`, session);

  return token;
}

export async function getSession(token: string): Promise<Session | null> {
  const session = await readBlob<Session | null>(`sessions/${token}.json`, null);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }

  return session;
}

export async function deleteSession(token: string): Promise<void> {
  try {
    const { del } = await import("@vercel/blob");
    const baseUrl = getBlobBaseUrl();
    if (baseUrl) {
      await del(`${baseUrl}/sessions/${token}.json`);
    }
  } catch {}
}
