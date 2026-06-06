/**
 * POST /api/shop/license-codes/redeem
 * Body: { code: string }
 *
 * Kullanıcı için aktivasyon kodu doğrular ve yeni PAID order yaratır.
 * Kod tek seferliktir; redeem sonrası başkası kullanamaz.
 *
 * Akış:
 *   1. Session zorunlu (üye olmalı)
 *   2. Kod var mı / kullanılmış mı / expire olmuş mu kontrol
 *   3. SKU geçerli mi → getSku() ile
 *   4. PAID order yarat (subscriptionExpiresAt = now + durationDays)
 *   5. Captcha lisansı için provisionCaptchaLicense() çağır (apiKey üretsin)
 *   6. Kodu redeemed olarak işaretle
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  findUserById,
  getLicenseCode,
  markLicenseCodeRedeemed,
  createOrder,
  type OrderItem,
} from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { provisionCaptchaLicense } from "@/lib/payments/captcha-provision";

export const runtime = "nodejs";

function generateLicenseKey(productId: string): string {
  const prefix = productId === "captchaerpide" ? "CAP" : productId === "finanserpide" ? "FRP" : "ERP";
  const rnd = Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 6).toUpperCase()
  ).join("-");
  const year = new Date().getUTCFullYear();
  return `${prefix}-${year}-${rnd}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Önce giriş yapmalısınız" }, { status: 401 });
  }
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });

  let body: { code?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) return NextResponse.json({ error: "Aktivasyon kodu boş olamaz" }, { status: 400 });

  const rec = await getLicenseCode(code);
  if (!rec) return NextResponse.json({ error: "Kod bulunamadı veya yanlış" }, { status: 404 });
  if (rec.redeemedBy) return NextResponse.json({ error: "Bu kod daha önce kullanılmış" }, { status: 409 });
  if (rec.expiresAt && new Date(rec.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Bu kodun geçerlilik süresi dolmuş" }, { status: 410 });
  }

  const sku = getSku(rec.skuId);
  if (!sku) return NextResponse.json({ error: "Kod geçersiz ürüne bağlı" }, { status: 500 });
  const product = getProductOfSku(rec.skuId);
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 500 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + rec.durationDays * 86_400_000);
  const licenseKey = generateLicenseKey(product.id);

  const orderItem: OrderItem = {
    skuId: sku.id,
    productId: product.id,
    productName: product.name,
    skuName: sku.name,
    price: 0,
    licenseKey,
  };

  // CaptchaERPIDE için backend'den API key + dashboard URL al.
  if (product.id === "captchaerpide") {
    try {
      const prov = await provisionCaptchaLicense({
        email: user.email,
        firstName: user.name || user.email.split("@")[0],
        lastName: user.surname,
        sku,
        isTrial: false,
        expiresAt,
        upstreamRef: `code-redeem:${rec.code}`,
      });
      if (prov.ok) {
        orderItem.apiKey = prov.apiKey;
        orderItem.apiBaseUrl = prov.apiBaseUrl;
        orderItem.dashboardUrl = prov.dashboardUrl;
        orderItem.maxSolvesPerDay = prov.maxSolvesPerDay;
      } else {
        console.error("[redeem] captcha provision failed:", prov.error);
      }
    } catch (e) {
      // Provisioning hata verirse de order'ı yarat; kullanıcı destekten yardım alır.
      console.error("[redeem] captcha provision failed:", e);
    }
  }

  const order = await createOrder({
    userId: user.id,
    items: [orderItem],
    totalPrice: 0,
    currency: "USD",
    conversationId: `code-${rec.code}-${Date.now()}`,
    status: "PAID",
    subscriptionExpiresAt: expiresAt.toISOString(),
    billingCycle: "monthly",
    autoRenewEnabled: false,
    paidAt: now.toISOString(),
  });

  await markLicenseCodeRedeemed(rec.code, user.id, order.id);

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    productName: product.name,
    skuName: sku.name,
    expiresAt: expiresAt.toISOString(),
    licenseKey,
  });
}
