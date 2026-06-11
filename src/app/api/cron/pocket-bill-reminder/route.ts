/**
 * Daily PocketERPIDE bill reminder cron.
 *
 * Trigger: Vercel Cron (vercel.json) 06:00 UTC ≈ 09:00 TR günde 1 kere.
 * Auth: Vercel'in CRON_SECRET'i ile.
 *
 * Akış:
 *   1. Tüm kayıtlı push token'ları çek (data/pocket-push-tokens.json)
 *   2. Her unique userId için PocketData'sını oku
 *   3. findUpcomingBills(data, now, 1) → YARIN vadesi olan ödemeler
 *   4. Varsa kullanıcının tüm cihaz token'larına push gönder (Expo Push API)
 *   5. DeviceNotRegistered ticket'ları için tokenı temizle
 *
 * Notlar:
 *   - Aynı kullanıcının N cihazı varsa N push gider — istenmeyen değilse aç bırak;
 *     "primary device" konsepti şu an yok
 *   - Test için ?dry=1 query param: gönderme, sadece kaç notification çıkacağını dön
 *   - Test için ?days=X: yarın yerine X gün sonrası için bul
 */
import { NextResponse } from "next/server";
import {
  unregisterPushToken,
  getUserData,
  type PushTokenRecord,
} from "@/lib/pocket-store";
import { findUpcomingBills, buildNotificationContent } from "@/lib/pocket-bill-finder";
import type { PocketData } from "@/lib/pocket-types";
import { sendPush, isTokenInvalidTicket, type ExpoPushMessage } from "@/lib/expo-push";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 dakika — büyük kullanıcı tabanı için

function authorizedAsCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (auth.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < auth.length; i++) mismatch |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

const PUSH_TOKENS_KEY = "data/pocket-push-tokens.json";

async function readAllPushTokens(): Promise<Record<string, PushTokenRecord>> {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";
  const parts = token.split("_");
  if (parts.length < 4) return {};
  const storeId = parts[3].toLowerCase();
  try {
    const res = await fetch(
      `https://${storeId}.public.blob.vercel-storage.com/${PUSH_TOKENS_KEY}?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, PushTokenRecord>;
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  if (!authorizedAsCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const days = parseInt(url.searchParams.get("days") ?? "1", 10);
  if (isNaN(days) || days < 1 || days > 30) {
    return NextResponse.json({ error: "days must be 1-30" }, { status: 400 });
  }

  const startedAt = Date.now();
  const now = new Date();

  // 1) Tüm push token'ları al, userId bazlı grupla
  const tokenMap = await readAllPushTokens();
  const userTokens = new Map<string, PushTokenRecord[]>();
  for (const rec of Object.values(tokenMap)) {
    if (!userTokens.has(rec.userId)) userTokens.set(rec.userId, []);
    userTokens.get(rec.userId)!.push(rec);
  }

  const stats = {
    usersChecked: 0,
    usersWithBills: 0,
    notificationsSent: 0,
    invalidTokensRemoved: 0,
    errors: [] as string[],
  };

  const messages: ExpoPushMessage[] = [];
  const messageOwners: string[] = []; // ticket index → expoPushToken (cleanup için)

  // 2) Her kullanıcı için PocketData çek + bill bul + mesaj üret
  for (const [userId, recs] of userTokens) {
    stats.usersChecked++;
    let data: PocketData | null = null;
    try {
      const stored = await getUserData(userId);
      if (!stored) continue;
      data = stored.data as PocketData;
    } catch (err) {
      stats.errors.push(`getUserData(${userId}): ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (!data) continue;

    const summary = findUpcomingBills(data, now, days);
    if (!summary) continue;

    stats.usersWithBills++;
    const { title, body } = buildNotificationContent(summary);

    for (const rec of recs) {
      messages.push({
        to: rec.expoPushToken,
        title,
        body,
        data: {
          type: "bill-reminder",
          dueDate: summary.date,
          count: summary.bills.length,
          totalAmount: summary.totalAmount,
        },
        sound: "default",
        priority: "high",
        channelId: "default",
      });
      messageOwners.push(rec.expoPushToken);
    }
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      durationMs: Date.now() - startedAt,
      stats,
      sample: messages.slice(0, 5).map((m) => ({ to: m.to.slice(0, 25) + "…", title: m.title, body: m.body })),
    });
  }

  // 3) Expo Push API'ye batch gönder
  if (messages.length > 0) {
    const tickets = await sendPush(messages);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === "ok") {
        stats.notificationsSent++;
      } else if (isTokenInvalidTicket(ticket)) {
        // Token geçersiz → DB'den temizle
        const badToken = messageOwners[i];
        const rec = tokenMap[badToken];
        if (rec) {
          try {
            await unregisterPushToken(rec.userId, badToken);
            stats.invalidTokensRemoved++;
          } catch (err) {
            stats.errors.push(`unregisterPushToken: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      } else {
        stats.errors.push(`expo: ${ticket.message ?? ticket.details?.error ?? "unknown"}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    stats,
  });
}
