/**
 * Daily auto-renewal cron.
 *
 * Trigger: Vercel Cron (vercel.json) at 03:00 UTC every day.
 * Auth: Vercel adds the `Authorization: Bearer <CRON_SECRET>` header
 *       automatically when calling its own cron endpoints. We verify it
 *       against process.env.CRON_SECRET so nobody on the open internet
 *       can hand-trigger a payment cycle.
 *
 * Logic:
 *   For each PAID order that:
 *     - has autoRenewEnabled !== false
 *     - has subscriptionExpiresAt within the next 36 hours
 *     - hasn't been retried in the last 12 hours (lastRenewAttemptAt window)
 *     - whose user has iyzicoCardUserKey + iyzicoCardToken on file
 *
 *   Charge the saved card via iyzico, and:
 *     - On success: create a new follow-on order (PAID, paidAt=now, items
 *       cloned with FRESH api keys provisioned, subscriptionExpiresAt
 *       extended by the cycle), mail the customer.
 *     - On failure: stamp lastRenewAttemptAt + lastRenewError so we retry
 *       tomorrow, mail the customer to update card.
 *
 *   Trial orders are NEVER auto-renewed — trials are an evaluation period,
 *   the customer must explicitly buy.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  listAllOrders,
  findUserById,
  createOrder,
  updateOrder,
  type OrderRecord,
  type OrderItem,
} from "@/lib/auth/user-store";
import { getSku } from "@/lib/products";
import { chargeSavedCard, isMockMode } from "@/lib/payments/iyzico";
import { provisionCaptchaLicense } from "@/lib/payments/captcha-provision";
import { sendOrderConfirmationEmail, sendRenewalFailedEmail, sendExpiringSoonEmail } from "@/lib/payments/email";
import { invalidateRemoteLicenseCache } from "@/lib/payments/license-service-invalidate";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes — cron can take a while if many renewals

const RENEW_WINDOW_HOURS = 36;
const RETRY_COOLDOWN_HOURS = 12;


function authorizedAsCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  // Constant-time compare to be safe against timing attacks.
  const expected = `Bearer ${secret}`;
  if (auth.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < auth.length; i++) mismatch |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}


function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (60 * 60 * 1000);
}


async function processOrder(order: OrderRecord, now: Date): Promise<{ status: string; orderId: string; detail?: string }> {
  if (order.status !== "PAID") return { status: "skip:not-paid", orderId: order.id };
  if (order.cancelledAt) {
    // Kullanıcı iptal etti — yenileme yapma. Süre dolduğunda EXPIRED'a düşer.
    return { status: "skip:cancelled", orderId: order.id };
  }
  if (order.autoRenewEnabled === false) {
    // Auto-renew kapalı — "bitiyor" hatırlatma email'i at (7 ve 1 gün kala, 1'er kez)
    await maybeSendExpiringEmail(order, now);
    return { status: "skip:auto-renew-off", orderId: order.id };
  }
  if (!order.subscriptionExpiresAt) return { status: "skip:no-expiry", orderId: order.id };

  const expiresAt = new Date(order.subscriptionExpiresAt);
  if (expiresAt.getTime() - now.getTime() > RENEW_WINDOW_HOURS * 60 * 60 * 1000) {
    return { status: "skip:not-due-yet", orderId: order.id };
  }
  if (order.lastRenewAttemptAt) {
    const lastAttempt = new Date(order.lastRenewAttemptAt);
    if (hoursBetween(now, lastAttempt) < RETRY_COOLDOWN_HOURS) {
      return { status: "skip:cooldown", orderId: order.id };
    }
  }

  const user = await findUserById(order.userId, true);
  if (!user) return { status: "skip:no-user", orderId: order.id };
  if (!user.iyzicoCardUserKey || !user.iyzicoCardToken) {
    await updateOrder(order.id, {
      lastRenewAttemptAt: now.toISOString(),
      lastRenewError: "Kayıtlı kart yok — manuel yenileme gerekiyor",
    });
    return { status: "fail:no-card", orderId: order.id };
  }

  // Charge the saved card.
  const newConversationId = `RENEW-${randomUUID()}`;
  const cycle = order.billingCycle || "monthly";
  const cycleDays = cycle === "yearly" ? 365 : 30;

  const basketItems = order.items.map((it) => ({
    id: it.skuId,
    name: `${it.productName} ${it.skuName} (Yenileme)`,
    category1: it.productName,
    itemType: "VIRTUAL" as const,
    price: it.price,
  }));

  const billing = {
    contactName: `${user.name} ${user.surname}`.trim(),
    city: user.city || "Istanbul",
    country: "Turkey",
    address: user.address || "Online",
  };

  const buyer = {
    id: user.id,
    name: user.name,
    surname: user.surname || user.name,
    email: user.email,
    gsmNumber: user.gsmNumber || "+905551112233",
    identityNumber: user.identityNumber || "74300864791", // iyzico test id when missing
    registrationAddress: user.address || "Online",
    city: user.city || "Istanbul",
    country: "Turkey",
    ip: "85.34.78.112",
  };

  const charge = await chargeSavedCard({
    conversationId: newConversationId,
    basketId: order.id, // tied to the previous order for traceability
    price: order.totalPrice,
    paidPrice: order.totalPrice,
    // Renewal uses the same currency the buyer originally chose. iyzico
    // multi-currency lets us bill USD on a TRY card and vice versa, but
    // we never silently switch a customer's currency mid-subscription.
    currency: (order.currency === "USD" || order.currency === "EUR" || order.currency === "GBP") ? order.currency : "TRY",
    cardUserKey: user.iyzicoCardUserKey,
    cardToken: user.iyzicoCardToken,
    buyer,
    billingAddress: billing,
    basketItems,
  });

  if (charge.status !== "success") {
    const errorReason = charge.errorMessage || charge.errorCode || "Bilinmeyen ödeme hatası";
    await updateOrder(order.id, {
      lastRenewAttemptAt: now.toISOString(),
      lastRenewError: errorReason,
    });
    // Email — bu order için failure email'i bugün atılmadıysa at (idempotent).
    const lastFailureMail = order.renewFailedEmailSentAt ? new Date(order.renewFailedEmailSentAt) : null;
    const shouldMail = !lastFailureMail || hoursBetween(now, lastFailureMail) > 20;
    if (shouldMail) {
      try {
        await sendRenewalFailedEmail({
          to: user.email,
          buyerName: `${user.name} ${user.surname}`.trim(),
          order,
          errorReason,
        });
        await updateOrder(order.id, { renewFailedEmailSentAt: now.toISOString() });
      } catch (e) {
        console.error("[cron-renew] failure email failed:", e);
      }
    }
    return {
      status: "fail:charge-declined",
      orderId: order.id,
      detail: errorReason,
    };
  }

  // Re-provision a fresh license on each product backend for the new cycle.
  const newSubExpiresAt = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  const renewedItems: OrderItem[] = [];

  for (const item of order.items) {
    if (item.productId === "captchaerpide") {
      const sku = getSku(item.skuId);
      if (!sku) { renewedItems.push(item); continue; }
      const prov = await provisionCaptchaLicense({
        email: user.email,
        firstName: user.name,
        lastName: user.surname,
        sku,
        isTrial: false,
        expiresAt: newSubExpiresAt,
        upstreamRef: `renew/${newConversationId}/${item.skuId}`,
      });
      if (prov.ok) {
        renewedItems.push({
          ...item,
          apiKey: prov.apiKey,
          apiKeyId: prov.apiKeyId,
          apiBaseUrl: prov.apiBaseUrl,
          dashboardUrl: prov.dashboardUrl,
          backendUserId: prov.backendUserId,
          backendLicenseId: prov.backendLicenseId,
          maxSolvesPerDay: prov.maxSolvesPerDay,
        });
      } else {
        // Payment took; we just couldn't provision. Keep the new key blank;
        // operator will need to investigate. Don't drop the order though.
        console.error("[cron-renew] provision failed after successful charge:", prov.error);
        renewedItems.push(item);
      }
    } else {
      renewedItems.push(item);
    }
  }

  // Create the follow-on order, link it back to the parent.
  const newOrder = await createOrder({
    userId: order.userId,
    items: renewedItems,
    totalPrice: order.totalPrice,
    currency: order.currency,
    paymentId: charge.paymentId,
    conversationId: newConversationId,
    status: "PAID",
    paidAt: now.toISOString(),
    subscriptionExpiresAt: newSubExpiresAt.toISOString(),
    billingCycle: cycle,
    autoRenewEnabled: true,
    renewedFromOrderId: order.id,
  });

  // Stamp the parent order so it doesn't get picked up again tomorrow.
  await updateOrder(order.id, {
    autoRenewEnabled: false,
    lastRenewAttemptAt: now.toISOString(),
    lastRenewError: undefined,
  });

  // Notify the customer.
  try {
    await sendOrderConfirmationEmail({
      to: user.email,
      buyerName: `${user.name} ${user.surname}`.trim(),
      order: newOrder,
    });
  } catch (e) {
    console.error("[cron-renew] confirmation email failed:", e);
  }

  // FinansERPIDE (ve diğer ürünler) cache'ini invalidate et — yeni order
  // panel'de görünür, ürünler hemen yeni state'i çekmeli.
  try {
    await invalidateRemoteLicenseCache(user.email);
  } catch (e) {
    console.error("[cron-renew] license cache invalidate failed:", e);
  }

  return { status: "ok:renewed", orderId: order.id, detail: newOrder.id };
}


/**
 * "Aboneliğin bitiyor" hatırlatma email'i. Çağrı koşulu:
 *   - auto-renew=false (zaten yenilenmeyecek) veya cancelled
 *   - 7 gün veya 1 gün kala
 *   - bu eşik için bugün/dün mail atılmadı (renewFailedEmailSentAt'i değil,
 *     expiringSoonEmailSentAt'i kullanır — ayrı idempotency tracker)
 */
async function maybeSendExpiringEmail(order: OrderRecord, now: Date): Promise<void> {
  if (!order.subscriptionExpiresAt) return;
  const expiresAt = new Date(order.subscriptionExpiresAt);
  const msLeft = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  // Sadece pozitif (geleceğe ait) ve 7 veya 1 gün kalanlar
  if (daysLeft !== 7 && daysLeft !== 1) return;

  // Spam koruması: aynı eşik için 18+ saat geçmediyse atma.
  const lastMail = order.expiringSoonEmailSentAt ? new Date(order.expiringSoonEmailSentAt) : null;
  if (lastMail && hoursBetween(now, lastMail) < 18) return;

  const user = await findUserById(order.userId, true);
  if (!user) return;

  try {
    await sendExpiringSoonEmail({
      to: user.email,
      buyerName: `${user.name} ${user.surname}`.trim(),
      order,
      daysLeft,
    });
    await updateOrder(order.id, { expiringSoonEmailSentAt: now.toISOString() });
  } catch (e) {
    console.error("[cron-renew] expiring email failed:", e);
  }
}


export async function GET(req: Request) {
  // Local-dev convenience: when iyzico isn't configured at all, the whole
  // cron is a no-op, so dev runs don't accidentally mock-renew everything.
  if (!authorizedAsCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const allOrders = await listAllOrders();

  const results: Array<{ status: string; orderId: string; detail?: string }> = [];
  for (const order of allOrders) {
    try {
      results.push(await processOrder(order, now));
    } catch (e) {
      console.error("[cron-renew] processOrder threw:", e);
      results.push({ status: "fail:exception", orderId: order.id, detail: String(e) });
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  console.log("[cron-renew] done", { ranAt: now.toISOString(), summary, mock: isMockMode() });
  return NextResponse.json({ ok: true, ranAt: now.toISOString(), summary, results });
}

export const POST = GET; // Vercel cron uses GET; manual triggers may POST.
