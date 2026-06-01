import { NextResponse } from "next/server";
import { retrieveCheckout } from "@/lib/payments/iyzico";
import { findOrderByConversationId, updateOrder, findUserById } from "@/lib/auth/user-store";
import { sendOrderConfirmationEmail } from "@/lib/payments/email";

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

  const updated = await updateOrder(order.id, {
    status: "PAID",
    paymentId: result.paymentId,
    iyzicoToken: token,
    paidAt: new Date().toISOString(),
  });

  try {
    const user = await findUserById(order.userId);
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
