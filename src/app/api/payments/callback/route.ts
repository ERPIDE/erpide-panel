import { NextResponse } from "next/server";
import { retrieveCheckout } from "@/lib/payments/iyzico";
import { getPlan } from "@/lib/payments/plans";
import { generateLicenseKey } from "@/lib/payments/license";
import { sendLicenseEmail } from "@/lib/payments/email";

export const runtime = "nodejs";

async function handle(req: Request) {
  const url = new URL(req.url);
  let token: string | null = null;
  let buyerEmailOverride: string | null = null;
  let buyerNameOverride: string | null = null;

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      token = (form.get("token") as string) || null;
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      token = body.token;
      buyerEmailOverride = body.email || null;
      buyerNameOverride = body.name || null;
    }
  }
  if (!token) token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/odeme/basarisiz?reason=missing-token", req.url));
  }

  const result = await retrieveCheckout(token);

  if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
    const reason = encodeURIComponent(result.errorMessage || "Ödeme onaylanmadı");
    return NextResponse.redirect(new URL(`/odeme/basarisiz?reason=${reason}`, req.url));
  }

  const plan = result.basketId ? getPlan(result.basketId) : undefined;
  if (!plan) {
    return NextResponse.redirect(
      new URL("/odeme/basarisiz?reason=plan-bulunamadi", req.url)
    );
  }

  const licenseKey = generateLicenseKey(plan.productId);
  const buyerEmail = buyerEmailOverride || result.buyerEmail || "info@erpide.com";
  const buyerName = buyerNameOverride || "Müşteri";

  try {
    await sendLicenseEmail({
      to: buyerEmail,
      buyerName,
      plan,
      licenseKey,
      paymentId: result.paymentId || "—",
    });
  } catch (e) {
    console.error("[callback] license email gönderilemedi:", e);
  }

  console.log("[purchase]", {
    ts: new Date().toISOString(),
    product: plan.productId,
    plan: plan.id,
    price: plan.price,
    paymentId: result.paymentId,
    conversationId: result.conversationId,
    buyerEmail,
    licenseKey,
  });

  const successUrl = new URL("/odeme/basarili", req.url);
  successUrl.searchParams.set("license", licenseKey);
  successUrl.searchParams.set("plan", plan.id);
  return NextResponse.redirect(successUrl, 303);
}

export const POST = handle;
export const GET = handle;
