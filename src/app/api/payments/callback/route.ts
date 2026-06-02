import { NextResponse } from "next/server";
import { retrieveCheckout } from "@/lib/payments/iyzico";
import { findOrderByConversationId, updateOrder, findUserById, type OrderItem } from "@/lib/auth/user-store";
import { sendOrderConfirmationEmail } from "@/lib/payments/email";
import { provisionCaptchaLicense } from "@/lib/payments/captcha-provision";
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
          // Monthly plans: don't set expiresAt — renewed by future cron;
          // null = perpetual on the backend until we revoke or extend.
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
    } else {
      provisionedItems.push(item);
    }
  }

  const updated = await updateOrder(order.id, {
    status: "PAID",
    paymentId: result.paymentId,
    iyzicoToken: token,
    paidAt: new Date().toISOString(),
    items: provisionedItems,
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
