/**
 * PocketERPIDE mobile backend storage.
 *
 * Moved off Vercel Blob (data/pocket-tokens.json, data/pocket-data.json,
 * data/pocket-push-tokens.json) onto Neon Postgres — same reason as the
 * rest of Phase 2 migration: per-write Blob ops were eating the Hobby quota.
 *
 * Tablolar (prisma/schema):
 *  - PocketToken      → token → { userId, label, createdAt, lastUsedAt }
 *  - PocketData       → userId → PocketData (updatedAt, data Json)
 *  - PocketPushToken  → expoPushToken → { userId, platform, deviceName, ... }
 */
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { getPrisma } from "./db";

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

// ===== TOKENS =====

export async function issueToken(userId: string, label = "mobile"): Promise<string> {
  const token = "pkt_" + randomBytes(24).toString("base64url");
  await getPrisma().pocketToken.create({
    data: {
      token,
      userId,
      label,
      createdAt: new Date(),
    },
  });
  return token;
}

export async function validateToken(token: string): Promise<PocketTokenRecord | null> {
  if (!token || !token.startsWith("pkt_")) return null;
  const row = await getPrisma().pocketToken.findUnique({ where: { token } });
  if (!row) return null;

  // Fire-and-forget lastUsedAt update; mobile devices poll a lot, don't block.
  getPrisma()
    .pocketToken.update({
      where: { token },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    userId: row.userId,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString(),
  };
}

export async function revokeToken(token: string): Promise<boolean> {
  try {
    await getPrisma().pocketToken.delete({ where: { token } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return false;
    }
    throw e;
  }
}

export async function listTokensForUser(
  userId: string,
): Promise<Array<{ token: string } & PocketTokenRecord>> {
  const rows = await getPrisma().pocketToken.findMany({ where: { userId } });
  return rows.map((r) => ({
    token: r.token,
    userId: r.userId,
    label: r.label,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt?.toISOString(),
  }));
}

// ===== POCKET DATA =====

export async function getUserData(userId: string): Promise<PocketDataRecord | null> {
  const row = await getPrisma().pocketData.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    updatedAt: row.updatedAt.toISOString(),
    data: row.data,
  };
}

export async function setUserData(userId: string, data: unknown): Promise<PocketDataRecord> {
  const now = new Date();
  const row = await getPrisma().pocketData.upsert({
    where: { userId },
    create: { userId, data: data as Prisma.InputJsonValue, updatedAt: now },
    update: { data: data as Prisma.InputJsonValue, updatedAt: now },
  });
  return {
    updatedAt: row.updatedAt.toISOString(),
    data: row.data,
  };
}

// ===== PUSH TOKENS =====
// Bir kullanıcı birden fazla cihazdan giriş yapabilir (iPhone + iPad gibi);
// her cihazın expoPushToken'ını ayrı satır olarak tutuyoruz. Aynı token tekrar
// register'lanırsa update edilir (uniqueness expoPushToken üstünden).

export interface PushTokenRecord {
  expoPushToken: string;
  userId: string;
  platform: string;     // "ios" | "android" | "web"
  deviceName: string;
  createdAt: string;
  lastUsedAt: string;
}

export async function registerPushToken(
  userId: string,
  expoPushToken: string,
  platform: string,
  deviceName: string,
): Promise<PushTokenRecord> {
  const now = new Date();
  const row = await getPrisma().pocketPushToken.upsert({
    where: { expoPushToken },
    create: {
      expoPushToken,
      userId,
      platform,
      deviceName,
      createdAt: now,
      lastUsedAt: now,
    },
    update: {
      userId,
      platform,
      deviceName,
      lastUsedAt: now,
    },
  });
  return {
    expoPushToken: row.expoPushToken,
    userId: row.userId,
    platform: row.platform,
    deviceName: row.deviceName,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt.toISOString(),
  };
}

export async function unregisterPushToken(
  userId: string,
  expoPushToken: string,
): Promise<boolean> {
  // Sadece sahibi unregister edebilir (cross-user delete'i engelle).
  const result = await getPrisma().pocketPushToken.deleteMany({
    where: { expoPushToken, userId },
  });
  return result.count > 0;
}

export async function listPushTokensForUser(userId: string): Promise<PushTokenRecord[]> {
  const rows = await getPrisma().pocketPushToken.findMany({ where: { userId } });
  return rows.map((r) => ({
    expoPushToken: r.expoPushToken,
    userId: r.userId,
    platform: r.platform,
    deviceName: r.deviceName,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt.toISOString(),
  }));
}
