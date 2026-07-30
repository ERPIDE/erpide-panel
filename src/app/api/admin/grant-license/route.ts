/**
 * POST /api/admin/grant-license
 * Header: x-admin-token: <ADMIN_BOOTSTRAP_TOKEN>  (veya owner oturumu)
 * Body:   { email: string, skuIds: string[], durationDays?: number, note?: string }
 *
 * Bir kullanıcıya doğrudan (ödeme/kod olmadan) lisans atar — kurumsal teslim,
 * destek telafisi, demo hesabı gibi durumlar için. PAID order yaratır ve
 * uzak lisans cache'ini temizler; müşteri hiçbir kod girmez.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE } from "@/lib/auth";
import { findUserByEmail, createOrder, type OrderItem } from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { invalidateRemoteLicenseCache } from "@/lib/payments/license-service-invalidate";

export const runtime = "nodejs";

function generateLicenseKey(productId: string): string {
  const prefix = productId === "captchaerpide" ? "CAP" : productId === "finanserpide" ? "FRP" : "ERP";
  const rnd = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join("-");
  return `${prefix}-${new Date().getUTCFullYear()}-${rnd}`;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = await getOwnerSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    const token = req.headers.get("x-admin-token");
    if (!token || token !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
      return NextResponse.json({ error: "Yetkisiz — owner girişi veya admin token gerekli" }, { status: 403 });
    }
  }

  let body: { email?: string; skuIds?: string[]; durationDays?: number; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }

  void body.note;
  const email = (body.email || "").trim().toLowerCase();
  const skuIds = Array.isArray(body.skuIds) ? body.skuIds.filter(Boolean) : [];
  const durationDays = Math.max(1, Math.min(3650, Number(body.durationDays) || 30));
  if (!email || skuIds.length === 0) {
    return NextResponse.json({ error: "email ve skuIds zorunlu" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: `Kullanıcı bulunamadı: ${email}` }, { status: 404 });

  const items: OrderItem[] = [];
  for (const skuId of skuIds) {
    const sku = getSku(skuId);
    const product = sku ? getProductOfSku(skuId) : null;
    if (!sku || !product) return NextResponse.json({ error: `SKU bulunamadı: ${skuId}` }, { status: 404 });
    items.push({
      skuId: sku.id,
      productId: product.id,
      productName: product.name,
      skuName: sku.name,
      price: 0,
      licenseKey: generateLicenseKey(product.id),
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 86_400_000);
  const order = await createOrder({
    userId: user.id,
    items,
    totalPrice: 0,
    currency: "USD",
    conversationId: `admin-grant-${Date.now()}`,
    status: "PAID",
    subscriptionExpiresAt: expiresAt.toISOString(),
    billingCycle: "monthly",
    autoRenewEnabled: false,
    paidAt: now.toISOString(),
  });

  // finanserpide tarafı 5 dk cache'liyor — hemen görünsün.
  await invalidateRemoteLicenseCache(email).catch(() => {});

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    email,
    skus: items.map((i) => i.skuName),
    expiresAt: expiresAt.toISOString(),
  });
}
