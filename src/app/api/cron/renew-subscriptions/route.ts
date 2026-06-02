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
import { sendOrderConfirmationEmail } from "@/lib/payments/email";

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
  if (order.autoRenewEnabled === false) return { status: "skip:auto-renew-off", orderId: order.id };
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
    currency: "TRY",
    cardUserKey: user.iyzicoCardUserKey,
    cardToken: user.iyzicoCardToken,
    buyer,
    billingAddress: billing,
    basketItems,
  });

  if (charge.status !== "success") {
    await updateOrder(order.id, {
      lastRenewAttemptAt: now.toISOString(),
      lastRenewError: charge.errorMessage || charge.errorCode || "Bilinmeyen ödeme hatası",
    });
    return {
      status: "fail:charge-declined",
      orderId: order.id,
      detail: charge.errorMessage || charge.errorCode,
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

  return { status: "ok:renewed", orderId: order.id, detail: newOrder.id };
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
