/**
 * GET /api/cron/trial-reminders  (günlük)
 *
 * 14 günlük deneme sessizce bitiyordu: müşteri bir sabah giriyor, erişimi
 * kapalı, neden olduğunu bilmiyor. İki hatırlatma gönderiyoruz:
 *   - Bitmesine 3 gün kala  → "denemen bitiyor, devam etmek istersen"
 *   - Bittiği gün          → "denemen bitti, kaldığın yerden devam et"
 *
 * Idempotency: her hatırlatma siparişe damgalanır (trialReminderSent /
 * trialEndedNoticeSent). Cron günde bir kez çalışsa da iki kez tetiklense de
 * müşteri aynı maili iki kere almaz.
 *
 * Auth: Vercel cron `Authorization: Bearer <CRON_SECRET>` gönderir.
 */
import { NextResponse } from "next/server";
import { listAllOrders, updateOrder, findUserById } from "@/lib/auth/user-store";
import { sendTrialEndingSoonEmail, sendTrialEndedEmail } from "@/lib/payments/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bitmesine kaç gün kala hatırlatalım. */
const REMIND_DAYS_BEFORE = 3;

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

export async function GET(req: Request) {
  if (!authorizedAsCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orders = await listAllOrders();
  const now = Date.now();
  let endingSoon = 0;
  let ended = 0;
  let skipped = 0;

  for (const order of orders) {
    if (!order.isTrial || order.status !== "TRIAL" || !order.trialExpiresAt) continue;

    const expiresAt = new Date(order.trialExpiresAt).getTime();
    const msLeft = expiresAt - now;
    const daysLeft = Math.ceil(msLeft / 86_400_000);

    // Çok eski bitmiş denemeler için geriye dönük mail atmıyoruz — müşteriye
    // haftalar sonra "denemen bitti" demek gürültüden ibaret.
    const endedRecently = msLeft <= 0 && msLeft > -3 * 86_400_000;

    const item = order.items[0];
    if (!item) continue;

    if (msLeft > 0 && daysLeft <= REMIND_DAYS_BEFORE && !order.trialReminderSent) {
      const user = await findUserById(order.userId);
      if (!user) { skipped++; continue; }
      try {
        await sendTrialEndingSoonEmail({
          to: user.email,
          buyerName: `${user.name} ${user.surname}`.trim(),
          productName: item.productName,
          skuId: item.skuId,
          daysLeft: Math.max(1, daysLeft),
          expiresAt: order.trialExpiresAt,
        });
        await updateOrder(order.id, { trialReminderSent: new Date().toISOString() });
        endingSoon++;
      } catch (e) {
        console.error("[trial-reminders] bitiyor maili gönderilemedi:", order.id, e);
        skipped++;
      }
      continue;
    }

    if (endedRecently && !order.trialEndedNoticeSent) {
      const user = await findUserById(order.userId);
      if (!user) { skipped++; continue; }
      try {
        await sendTrialEndedEmail({
          to: user.email,
          buyerName: `${user.name} ${user.surname}`.trim(),
          productName: item.productName,
          skuId: item.skuId,
        });
        await updateOrder(order.id, {
          trialEndedNoticeSent: new Date().toISOString(),
          // Deneme fiilen bitti — sipariş durumunu da yansıt ki listelerde
          // "aktif deneme" gibi görünmesin.
          status: "EXPIRED",
        });
        ended++;
      } catch (e) {
        console.error("[trial-reminders] bitti maili gönderilemedi:", order.id, e);
        skipped++;
      }
    }
  }

  console.log("[trial-reminders]", { endingSoon, ended, skipped });
  return NextResponse.json({ ok: true, endingSoon, ended, skipped });
}
