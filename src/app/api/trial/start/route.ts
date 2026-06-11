import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSku, getProductOfSku } from "@/lib/products";
import { generateLicenseKey } from "@/lib/payments/license";
import { createOrder, hasUsedTrialForSku, findUserById, type OrderItem } from "@/lib/auth/user-store";
import { provisionCaptchaLicense } from "@/lib/payments/captcha-provision";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const TRIAL_DAYS = 3;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  // forceFresh: kullanıcı az önce OAuth ile kaydolmuş olabilir, cache stale
  // sebebiyle emailVerified=false sayıp deneme başlatmayı bloklamayalım.
  const user = await findUserById(session.userId, true);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
  if (user.emailVerified === false) {
    return NextResponse.json(
      { error: "Deneme başlatmak için önce e-postanı doğrulaman gerekiyor.", needsVerification: true },
      { status: 403 }
    );
  }

  let body: { skuId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const skuId = body.skuId;
  if (!skuId) return NextResponse.json({ error: "skuId gerekli" }, { status: 400 });

  const sku = getSku(skuId);
  const product = getProductOfSku(skuId);
  if (!sku || !product) {
    return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  }

  // forceFresh: double-click veya stale-cache yarışı sonucu iki trial
  // oluşmasını engelle. Blob'tan kesin son state'i oku.
  const already = await hasUsedTrialForSku(session.userId, skuId, true);
  if (already) {
    return NextResponse.json(
      { error: "Bu ürün için zaten bir deneme sürümü kullandınız" },
      { status: 409 }
    );
  }

  const licenseKey = generateLicenseKey(product.id);
  const expiresAtDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const expiresAt = expiresAtDate.toISOString();
  const conversationId = `TRIAL-${randomUUID()}`;

  // Provision the customer's runtime credentials on the product backend
  // (currently only CaptchaERPIDE). Without this the licenseKey we generate
  // here is just decoration — captcha.erpide.com wouldn't know about the
  // customer and every API call from them would 401.
  const item: OrderItem = {
    skuId: sku.id,
    productId: product.id,
    productName: product.name,
    skuName: sku.name,
    price: 0,
    licenseKey,
  };

  if (product.id === "captchaerpide") {
    const prov = await provisionCaptchaLicense({
      email: user.email,
      firstName: user.name,
      lastName: user.surname,
      sku,
      isTrial: true,
      expiresAt: expiresAtDate,
      upstreamRef: conversationId,
    });
    if (!prov.ok) {
      // Hard-fail: without API credentials the trial is useless. Show the
      // real reason so we can fix infra problems quickly.
      return NextResponse.json(
        { error: `Deneme başlatılamadı (provision): ${prov.error}` },
        { status: 502 }
      );
    }
    item.apiKey = prov.apiKey;
    item.apiKeyId = prov.apiKeyId;
    item.apiBaseUrl = prov.apiBaseUrl;
    item.dashboardUrl = prov.dashboardUrl;
    item.backendUserId = prov.backendUserId;
    item.backendLicenseId = prov.backendLicenseId;
    item.maxSolvesPerDay = prov.maxSolvesPerDay;
  }

  const order = await createOrder({
    userId: session.userId,
    items: [item],
    totalPrice: 0,
    currency: "TRY",
    conversationId,
    status: "TRIAL",
    isTrial: true,
    trialExpiresAt: expiresAt,
  });

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      licenseKey,
      productName: product.name,
      skuName: sku.name,
      apiKey: item.apiKey,
      apiBaseUrl: item.apiBaseUrl,
      trialExpiresAt: expiresAt,
      trialDays: TRIAL_DAYS,
    },
  });
}
