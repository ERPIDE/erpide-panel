/**
 * POST /api/trial/start  { skuId }
 *
 * 14 günlük ücretsiz deneme başlatır. Kart istemez, kod üretip müşteriye
 * yapıştırtmaz: TRIAL statüsünde bir sipariş açılır, ürün tarafı lisansı
 * license-service üzerinden görür ve müşteri erpide.com hesabıyla doğrudan
 * içeri girer.
 *
 * Kurallar:
 *   - Giriş yapmış olmak şart (deneme kimliğe bağlı)
 *   - SKU başına ÖMÜR BOYU tek deneme (hasUsedTrialForSku) — süresi dolmuş
 *     denemeyi tekrar başlatabilmek "sonsuz ücretsiz kullanım" demekti
 *   - noTrial ürünleri reddedilir (AI kontör gibi her kullanımda gerçek para
 *     yakanlar), satıştan kalkmış SKU'lar da öyle
 *   - Zaten aktif denemesi varsa yeni açmaz, mevcudu döner (çift tıklama)
 *
 * Deneme bitince license-service expiresAt'i geçmiş görür ve erişim kendiliğinden
 * kapanır — ayrı bir kapatma cron'u gerekmez.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  findUserByEmail,
  createOrder,
  findActiveTrialForUserSku,
  hasUsedTrialForSku,
  type OrderItem,
} from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { generateLicenseKey } from "@/lib/payments/license";
import { provisionFinanserpideSku } from "@/lib/payments/finanserpide-provision";
import { invalidateRemoteLicenseCache } from "@/lib/payments/license-service-invalidate";

export const runtime = "nodejs";

export const TRIAL_DAYS = 14;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId || !session.email) {
    return NextResponse.json({ error: "Denemeyi başlatmak için giriş yapmalısın." }, { status: 401 });
  }

  let body: { skuId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const skuId = (body.skuId || "").trim();
  const sku = skuId ? getSku(skuId) : null;
  const product = sku ? getProductOfSku(skuId) : null;
  if (!sku || !product) {
    return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  }
  if (product.noTrial) {
    return NextResponse.json(
      { error: `${product.name} için ücretsiz deneme sunulmuyor.` },
      { status: 403 }
    );
  }
  if (sku.legacy) {
    return NextResponse.json({ error: "Bu paket artık satışta değil." }, { status: 410 });
  }

  const user = await findUserByEmail(session.email);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Çift tıklama / geri gelme: yeni deneme açmak yerine mevcudu döndür.
  const active = await findActiveTrialForUserSku(user.id, sku.id);
  if (active) {
    return NextResponse.json({
      ok: true,
      alreadyActive: true,
      orderId: active.id,
      expiresAt: active.trialExpiresAt,
    });
  }

  if (await hasUsedTrialForSku(user.id, sku.id)) {
    return NextResponse.json(
      { error: "Bu paketin ücretsiz denemesini daha önce kullandın. Devam etmek için satın alabilirsin.", used: true },
      { status: 409 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const item: OrderItem = {
    skuId: sku.id,
    productId: product.id,
    productName: product.name,
    skuName: sku.name,
    price: 0,
    licenseKey: generateLicenseKey(product.id),
  };

  const order = await createOrder({
    userId: user.id,
    items: [item],
    totalPrice: 0,
    currency: "TRY",
    conversationId: `trial-${sku.id}-${now.getTime()}`,
    status: "TRIAL",
    isTrial: true,
    trialExpiresAt: expiresAt.toISOString(),
    billingCycle: "monthly",
    autoRenewEnabled: false,
  });

  // Ürün tarafında aboneliği aç — satın almadaki akışın aynısı. Başarısız
  // olursa denemeyi geri almıyoruz: lisans state'inin tek doğru kaynağı
  // license-service ve o bu siparişi zaten görüyor.
  if (product.id === "finanserpide") {
    const prov = await provisionFinanserpideSku({
      buyerEmail: user.email,
      paymentId: `trial-${order.id}`,
      sku,
      quantity: 1,
    });
    if (!prov.ok) console.error("[trial] finanserpide provision failed:", prov.error);
  }

  // Ürün tarafı 5 dk cache'liyor — deneme hemen görünsün.
  await invalidateRemoteLicenseCache(user.email).catch(() => {});

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    expiresAt: expiresAt.toISOString(),
    trialDays: TRIAL_DAYS,
  });
}
