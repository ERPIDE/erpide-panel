import { NextResponse } from "next/server";
import { retrieveCheckout } from "@/lib/payments/iyzico";
import { findOrderByConversationId, updateOrder, findUserById, updateUser, type OrderItem } from "@/lib/auth/user-store";
import { sendOrderConfirmationEmail } from "@/lib/payments/email";
import { provisionCaptchaLicense } from "@/lib/payments/captcha-provision";
import { provisionFinanserpideSku } from "@/lib/payments/finanserpide-provision";
import { getSku } from "@/lib/products";

export const runtime = "nodejs";

async function handle(req: Request) {
  const url = new URL(req.url);
  let token: string | null = null;

  if (req.method === "POST") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      token = (form.get("token") as string) || null;
    } else if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      token = body.token || null;
    }
  }
  if (!token) token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/odeme/basarisiz?reason=missing-token", req.url));

  const result = await retrieveCheckout(token);
  if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
    const reason = encodeURIComponent(result.errorMessage || "Ödeme onaylanmadı");
    return NextResponse.redirect(new URL(`/odeme/basarisiz?reason=${reason}`, req.url));
  }

  const conversationId = result.conversationId;
  if (!conversationId) {
    return NextResponse.redirect(new URL("/odeme/basarisiz?reason=no-conversation-id", req.url));
  }

  const order = await findOrderByConversationId(conversationId);
  if (!order) return NextResponse.redirect(new URL("/odeme/basarisiz?reason=order-not-found", req.url));

  const user = await findUserById(order.userId, true);
  const paidAt = new Date();

  // If the customer ticked "kartımı kaydet" on the checkout form, iyzico
  // returns cardUserKey + cardToken with this retrieve response. Stash them
  // on the user so the daily renewal cron can charge silently.
  if (user && result.cardUserKey && result.cardToken) {
    await updateUser(user.id, {
      iyzicoCardUserKey: result.cardUserKey,
      iyzicoCardToken: result.cardToken,
      iyzicoCardLastFour: result.lastFourDigits,
      iyzicoCardAssociation: result.cardAssociation,
      iyzicoCardSavedAt: paidAt.toISOString(),
    });
  }

  // Pick the cycle from the first item's SKU. Mixed-cycle orders are not a
  // thing right now (the cart only allows one product per checkout), so this
  // is fine. Default to monthly if for some reason the SKU is gone.
  const firstSku = getSku(order.items[0]?.skuId || "");
  const cycle: "monthly" | "yearly" = firstSku?.cycle === "yearly" ? "yearly" : "monthly";
  const cycleDays = cycle === "yearly" ? 365 : 30;
  const subscriptionExpiresAt = new Date(paidAt.getTime() + cycleDays * 24 * 60 * 60 * 1000);

  // Provision runtime credentials on each product backend. We do this BEFORE
  // marking the order PAID so the customer's Lisanslarım page never shows a
  // paid line with no API key on it. Failure here keeps the order at PENDING
  // and surfaces in /odeme/basarisiz so the user can retry rather than
  // silently owning a useless line item.
  const provisionedItems: OrderItem[] = [];
  for (const item of order.items) {
    if (item.productId === "captchaerpide" && user) {
      const sku = getSku(item.skuId);
      if (sku) {
        const prov = await provisionCaptchaLicense({
          email: user.email,
          firstName: user.name,
          lastName: user.surname,
          sku,
          isTrial: false,
          // Backend License.expires_at now mirrors the subscription window —
          // when the cycle ends, the backend automatically 403s every API
          // call until a renewal extends the license.
          expiresAt: subscriptionExpiresAt,
          upstreamRef: `${order.id}/${item.skuId}`,
        });
        if (!prov.ok) {
          console.error("[callback] captcha provision failed:", prov.error);
          const reason = encodeURIComponent(`provision-failed: ${prov.error}`);
          return NextResponse.redirect(new URL(`/odeme/basarisiz?reason=${reason}`, req.url));
        }
        provisionedItems.push({
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
        provisionedItems.push(item);
      }
    } else if ((item.productId === "finanserpide" || item.productId === "ai-kontor") && user) {
      const sku = getSku(item.skuId);
      if (sku && (sku.kind === "base" || sku.kind === "module" || sku.kind === "seat" || sku.kind === "credit")) {
        // Idempotency anchor: paymentId tek başına yetmiyor çünkü 1 ödemede
        // birden fazla satır olabilir (ek kullanıcı, kontör paketi). licenseKey
        // her satır için unique → tekrar deneme aynı satırı tekrar açmaz.
        const itemPaymentId = `${result.paymentId || order.id}-${item.licenseKey}`;
        const prov = await provisionFinanserpideSku({
          buyerEmail: user.email,
          paymentId: itemPaymentId,
          sku,
          quantity: 1, // checkout her unit'i ayrı OrderItem olarak yazıyor
        });
        if (!prov.ok) {
          // Soft-fail: finans.erpide.com geçici olarak kapalıysa ödemeyi
          // bekletmek yerine logla ve sonra retry et. Müşteri ödediği için
          // "Lisanslarım"'da satır gözükür; provisioning durumu cron'la senkronlanır.
          console.error("[callback] finanserpide provision failed:", prov.error, "sku=", sku.id);
        } else {
          console.log("[callback] finanserpide provisioned:", { sku: sku.id, kind: sku.kind, tenantId: prov.tenantId });
        }
      }
      provisionedItems.push(item);
    } else {
      provisionedItems.push(item);
    }
  }

  const updated = await updateOrder(order.id, {
    status: "PAID",
    paymentId: result.paymentId,
    iyzicoToken: token,
    paidAt: paidAt.toISOString(),
    items: provisionedItems,
    subscriptionExpiresAt: subscriptionExpiresAt.toISOString(),
    billingCycle: cycle,
    // Auto-renewal defaults to ON for paid orders (customer can toggle off
    // from Lisanslarım). Trial orders never auto-renew — the customer has
    // to explicitly buy.
    autoRenewEnabled: true,
  });

  try {
    if (user && updated) {
      await sendOrderConfirmationEmail({
        to: user.email,
        buyerName: `${user.name} ${user.surname}`,
        order: updated,
      });
    }
  } catch (e) {
    console.error("[callback] order confirmation email failed:", e);
  }

  console.log("[purchase]", {
    ts: new Date().toISOString(),
    orderId: order.id,
    userId: order.userId,
    items: order.items.map((i) => ({ sku: i.skuId, license: i.licenseKey })),
    totalPrice: order.totalPrice,
    paymentId: result.paymentId,
  });

  const successUrl = new URL("/odeme/basarili", req.url);
  successUrl.searchParams.set("order", order.id);
  return NextResponse.redirect(successUrl, 303);
}

export const POST = handle;
export const GET = handle;
