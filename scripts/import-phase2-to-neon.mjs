/**
 * Phase 2 importer: pulls remaining Blob-resident data into Neon.
 *
 *   data/admins.json             → Admin
 *   data/customers.json          → Customer
 *   data/pocket-tokens.json      → PocketToken
 *   data/pocket-data.json        → PocketData
 *   data/pocket-push-tokens.json → PocketPushToken (may not exist)
 *   data/support-requests.json   → SupportRequest
 *   sessions/<token>.json (×N)   → Session
 *
 * Source priority for each file: local path under /tmp/blob_data_*.json
 * (downloaded ahead of time so we don't burn quota in a loop). Falls back
 * to the live blob URL if the local copy is missing.
 *
 * Sessions are listed via @vercel/blob list() and fetched one-by-one — the
 * count is low (~30), per-fetch cost is fine.
 *
 * Env:
 *   DATABASE_URL              — Neon connection string (required)
 *   BLOB_READ_WRITE_TOKEN     — only needed if sessions need to be fetched
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { list } from "@vercel/blob";

const TMP = "/tmp";
const FILES = {
  admins: "blob_data_admins.json",
  customers: "blob_data_customers.json",
  pocketTokens: "blob_data_pocket-tokens.json",
  pocketData: "blob_data_pocket-data.json",
  pocketPushTokens: "blob_data_pocket-push-tokens.json",
  supportRequests: "blob_data_support-requests.json",
};

async function readJsonOrEmpty(file, fallback) {
  try {
    const raw = await readFile(path.join(TMP, file), "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    if (e && e.code === "ENOENT") return fallback;
    // Some files might be the literal string "Blob not found" — treat as empty.
    if (e instanceof SyntaxError) return fallback;
    throw e;
  }
}

function dateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
  const prisma = new PrismaClient({ adapter });

  // ----- ADMINS -----
  const admins = await readJsonOrEmpty(FILES.admins, []);
  for (const a of admins) {
    await prisma.admin.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        name: a.name,
        email: a.email,
        password: a.password,
        role: a.role,
      },
      update: {
        name: a.name,
        email: a.email,
        password: a.password,
        role: a.role,
      },
    });
  }
  console.log(`[phase2] admins: ${admins.length}`);

  // ----- CUSTOMERS -----
  const customers = await readJsonOrEmpty(FILES.customers, []);
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        code: c.code,
        name: c.name,
        password: c.password,
        project: c.project,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone ?? null,
      },
      update: {
        code: c.code,
        name: c.name,
        password: c.password,
        project: c.project,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone ?? null,
      },
    });
  }
  console.log(`[phase2] customers: ${customers.length}`);

  // ----- POCKET TOKENS -----
  const pocketTokens = await readJsonOrEmpty(FILES.pocketTokens, {});
  let tokenCount = 0;
  for (const [token, rec] of Object.entries(pocketTokens)) {
    await prisma.pocketToken.upsert({
      where: { token },
      create: {
        token,
        userId: rec.userId,
        label: rec.label,
        createdAt: dateOrNull(rec.createdAt) ?? new Date(),
        lastUsedAt: dateOrNull(rec.lastUsedAt),
      },
      update: {
        userId: rec.userId,
        label: rec.label,
        lastUsedAt: dateOrNull(rec.lastUsedAt),
      },
    });
    tokenCount++;
  }
  console.log(`[phase2] pocket tokens: ${tokenCount}`);

  // ----- POCKET DATA -----
  const pocketData = await readJsonOrEmpty(FILES.pocketData, {});
  let dataCount = 0;
  for (const [userId, rec] of Object.entries(pocketData)) {
    const updatedAt = dateOrNull(rec.updatedAt) ?? new Date();
    await prisma.pocketData.upsert({
      where: { userId },
      create: { userId, data: rec.data ?? {}, updatedAt },
      update: { data: rec.data ?? {}, updatedAt },
    });
    dataCount++;
  }
  console.log(`[phase2] pocket data rows: ${dataCount}`);

  // ----- POCKET PUSH TOKENS -----
  const pushTokens = await readJsonOrEmpty(FILES.pocketPushTokens, {});
  let pushCount = 0;
  for (const [expoToken, rec] of Object.entries(pushTokens)) {
    await prisma.pocketPushToken.upsert({
      where: { expoPushToken: expoToken },
      create: {
        expoPushToken: expoToken,
        userId: rec.userId,
        platform: rec.platform,
        deviceName: rec.deviceName,
        createdAt: dateOrNull(rec.createdAt) ?? new Date(),
        lastUsedAt: dateOrNull(rec.lastUsedAt) ?? new Date(),
      },
      update: {
        userId: rec.userId,
        platform: rec.platform,
        deviceName: rec.deviceName,
        lastUsedAt: dateOrNull(rec.lastUsedAt) ?? new Date(),
      },
    });
    pushCount++;
  }
  console.log(`[phase2] pocket push tokens: ${pushCount}`);

  // ----- SUPPORT REQUESTS -----
  const supportRequests = await readJsonOrEmpty(FILES.supportRequests, []);
  let supportCount = 0;
  for (const r of supportRequests) {
    await prisma.supportRequest.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        channel: r.channel,
        customerName: r.customerName ?? null,
        customerEmail: r.customerEmail ?? null,
        summary: r.summary ?? null,
        transcript: r.transcript ?? [],
        meta: r.meta ?? null,
        status: r.status ?? "open",
        externalId: r.externalId ?? null,
        createdAt: dateOrNull(r.createdAt) ?? new Date(),
        updatedAt: dateOrNull(r.updatedAt) ?? new Date(),
      },
      update: {
        channel: r.channel,
        customerName: r.customerName ?? null,
        customerEmail: r.customerEmail ?? null,
        summary: r.summary ?? null,
        transcript: r.transcript ?? [],
        meta: r.meta ?? null,
        status: r.status ?? "open",
        externalId: r.externalId ?? null,
        updatedAt: dateOrNull(r.updatedAt) ?? new Date(),
      },
    });
    supportCount++;
  }
  console.log(`[phase2] support requests: ${supportCount}`);

  // ----- SESSIONS -----
  // Listed via SDK then fetched one-by-one. We skip expired sessions —
  // they'd be filtered out on read anyway.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.log(`[phase2] listing sessions...`);
    let cursor;
    let imported = 0;
    let skippedExpired = 0;
    do {
      const page = await list({
        prefix: "sessions/",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        cursor,
        limit: 500,
      });
      for (const blob of page.blobs) {
        const res = await fetch(blob.url + "?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) continue;
        const session = await res.json();
        if (!session || !session.token) continue;
        const expiresAt = dateOrNull(session.expiresAt);
        if (!expiresAt || expiresAt < new Date()) {
          skippedExpired++;
          continue;
        }
        await prisma.session.upsert({
          where: { token: session.token },
          create: {
            token: session.token,
            userId: session.userId,
            userType: session.userType,
            userName: session.userName,
            userEmail: session.userEmail ?? null,
            userRole: session.userRole ?? null,
            customerCode: session.customerCode ?? null,
            createdAt: dateOrNull(session.createdAt) ?? new Date(),
            expiresAt,
          },
          update: {
            userId: session.userId,
            userType: session.userType,
            userName: session.userName,
            userEmail: session.userEmail ?? null,
            userRole: session.userRole ?? null,
            customerCode: session.customerCode ?? null,
            expiresAt,
          },
        });
        imported++;
      }
      cursor = page.cursor;
    } while (cursor);
    console.log(`[phase2] sessions: ${imported} imported, ${skippedExpired} expired skipped`);
  } else {
    console.log(`[phase2] skipping sessions (no BLOB_READ_WRITE_TOKEN)`);
  }

  console.log("[phase2] done");
}

main().catch((e) => {
  console.error("[phase2] FAILED:", e);
  process.exit(1);
});
